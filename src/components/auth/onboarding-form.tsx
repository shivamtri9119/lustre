async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setFormError(null);
  setSubmitting(true);

  const res = await fetch("/api/onboarding", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ salonName }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    setFormError(body?.error ?? "Couldn't create your salon. Please try again.");
    setSubmitting(false);
    return;
  }

  // The session token was issued before the salon existed. update() makes
  // the server re-read the user (now OWNER, with a salon) into the token
  // so the dashboard opens without a second login.
  //
  // DIAGNOSTIC BUILD: update() has been observed to hang indefinitely in
  // production with no console error and no visibly failed network
  // request. Racing it against a hard timeout guarantees the user is
  // never stuck on this screen again, and the console.log calls tell us
  // definitively whether update() resolved, rejected, or timed out.
  console.log("[onboarding] POST /api/onboarding succeeded, calling update()");

  function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms);
      promise.then(
        (value) => { clearTimeout(timer); resolve(value); },
        (err) => { clearTimeout(timer); reject(err); }
      );
    });
  }

  try {
    await withTimeout(update(), 8000);
    console.log("[onboarding] update() resolved successfully");
  } catch (err) {
    console.error("[onboarding] update() failed or timed out:", err);
  }

  console.log("[onboarding] navigating to /dashboard now");
  window.location.href = "/dashboard";
}
