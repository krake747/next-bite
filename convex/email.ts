import { isMailDevFallback, mailgunConfig } from "./env"

export { hasMailgunConfig, isMailDevFallback } from "./env"

type OtpType = "sign-in" | "email-verification" | "forget-password" | "change-email"

function otpSubject(type: OtpType): string {
    if (type === "forget-password") {
        return "Reset your Nextbite password"
    }
    if (type === "email-verification") {
        return "Verify your Nextbite email"
    }
    return "Your Nextbite sign-in code"
}

export async function sendTransactionalEmail(
    input: Readonly<{ to: string; subject: string; text: string }>,
): Promise<void> {
    const config = mailgunConfig()
    if (config === null) {
        if (isMailDevFallback()) {
            // Local development only. Log metadata, never recipient address, subject, or body:
            // the body carries the OTP code.
            console.log("sendTransactionalEmail skipped: explicit local dev fallback, email not sent")
            return
        }
        console.warn("sendTransactionalEmail refused: mail not configured")
        throw new Error("Email is not configured")
    }
    const body = new URLSearchParams({
        from: `Nextbite <login@${config.domain}>`,
        to: input.to,
        subject: input.subject,
        text: input.text,
    })
    const response = await fetch(`https://api.eu.mailgun.net/v3/${config.domain}/messages`, {
        method: "POST",
        headers: {
            Authorization: `Basic ${btoa(`api:${config.apiKey}`)}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
    })
    if (!response.ok) {
        // Status only: provider bodies are echoed back untrusted and stay out of logs and errors.
        console.warn(`Mailgun delivery failed with status ${response.status}`)
        throw new Error(`Email delivery failed with status ${response.status}`)
    }
}

export async function sendOtpEmail(email: string, otp: string, type: OtpType): Promise<void> {
    await sendTransactionalEmail({
        to: email,
        subject: otpSubject(type),
        text: `Your Nextbite code is ${otp}. It expires in 5 minutes.`,
    })
}
