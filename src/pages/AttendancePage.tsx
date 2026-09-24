export default function AttendancePage() {
  return (
    <iframe
      src="/attendancemain.html"
      title="Attendance Dashboard"
      style={{
        width: "100%",
        height: "calc(100vh - 60px)",
        border: "none",
        display: "block",
      }}
    />
  );
}
