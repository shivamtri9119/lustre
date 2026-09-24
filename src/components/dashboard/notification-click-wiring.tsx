// In notifications-dropdown.tsx, add state for which appointment is
// being viewed, and open the dialog on tap:

const [viewingAppointmentId, setViewingAppointmentId] = useState<string | null>(null);

function handleNotificationTap(notification: NotificationItem) {
  // CHECK THIS: confirm the actual key your notification-creation code
  // writes into `payload`. It's a Json field, not a typed column, so the
  // key name depends on whatever your notification-sending code used —
  // common patterns are one of these three. Log a real notification's
  // payload once (console.log(notification.payload)) to confirm which.
  const appointmentId =
    (notification.payload as any)?.appointmentId ??
    (notification.payload as any)?.data?.appointmentId ??
    (notification.payload as any)?.appointment?.id;

  if (appointmentId) {
    setViewingAppointmentId(appointmentId);
  }

  // keep whatever "mark as read" call you already make here
  markAsRead(notification.id);
}

// ...and render the dialog once, e.g. right after the dropdown's closing tag:
<AppointmentDetailsDialog
  appointmentId={viewingAppointmentId}
  open={!!viewingAppointmentId}
  onOpenChange={(open) => !open && setViewingAppointmentId(null)}
/>
