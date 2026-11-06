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

function isPresent(value: string | undefined): boolean {
    return value !== undefined && value.trim() !== ""
}

export function hasMailgunConfig(): boolean {
    return isPresent(process.env.MAILGUN_API_KEY) && isPresent(process.env.MAILGUN_DOMAIN)
}

// Explicit opt-in only. Missing mail configuration fails closed everywhere else, including
// preview and production, even when the OTP flag is on.
export function isMailDevFallback(): boolean {
    return process.env.MAILGUN_DEV_FALLBACK === "true"
}

export async function sendTransactionalEmail(
    input: Readonly<{ to: string; subject: string; text: string }>,
): Promise<void> {
    const apiKey = process.env.MAILGUN_API_KEY
    const domain = process.env.MAILGUN_DOMAIN
    if (!hasMailgunConfig()) {
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
        from: `Nextbite <login@${domain}>`,
        to: input.to,
        subject: input.subject,
        text: input.text,
    })
    const response = await fetch(`https://api.eu.mailgun.net/v3/${domain}/messages`, {
        method: "POST",
        headers: {
            Authorization: `Basic ${btoa(`api:${apiKey}`)}`,
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
