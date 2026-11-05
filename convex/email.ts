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
    const apiKey = process.env.MAILGUN_API_KEY
    const domain = process.env.MAILGUN_DOMAIN
    if (apiKey === undefined || apiKey === "" || domain === undefined || domain === "") {
        console.log(`sendTransactionalEmail (dev fallback) to=${input.to} subject=${input.subject} text=${input.text}`)
        return
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
        const errorText = await response.text()
        throw new Error(`Mailgun error: ${response.status} ${errorText}`)
    }
}

export async function sendOtpEmail(email: string, otp: string, type: OtpType): Promise<void> {
    await sendTransactionalEmail({
        to: email,
        subject: otpSubject(type),
        text: `Your Nextbite code is ${otp}. It expires in 5 minutes.`,
    })
}
