import nodemailer from "nodemailer";

type TodoMailPayload = {
  to: string;
  listName: string;
  todo: { title: string; note?: string | null; url?: string | null };
};

let cachedTransporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_PASS;
  if (!user || !pass) {
    console.warn("[mailer] Missing GMAIL_USER or GMAIL_PASS env vars; email disabled.");
    return null;
  }
  cachedTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
  return cachedTransporter;
}

export async function sendTodoNotificationEmail(payload: TodoMailPayload) {
  const transporter = getTransporter();
  if (!transporter) {
    return;
  }
  try {
    const subject = `New task in ${payload.listName}`;
    const lines = [
      `A new task was added to ${payload.listName}:`,
      "",
      `• ${payload.todo.title}`,
    ];
    if (payload.todo.note) {
      lines.push("", payload.todo.note);
    }
    if (payload.todo.url) {
      lines.push("", `Open task: ${payload.todo.url}`);
    }
    await transporter.sendMail({
      to: payload.to,
      from: `"My Calendar" <${process.env.GMAIL_USER}>`,
      subject,
      text: lines.join("\n"),
    });
  } catch (error) {
    console.error("[mailer] Failed to send todo notification", error);
  }
}

