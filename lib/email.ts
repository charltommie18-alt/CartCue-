const NOTIFY_EMAIL = "Charltommie18@gmail.com";

export async function sendEmail(subject: string, message: string) {
  try {
    await fetch(`https://formsubmit.co/ajax/${NOTIFY_EMAIL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        _subject: subject,
        _template: "table",
        message,
      }),
    });
  } catch {
    // never break the app because of email
  }
}
