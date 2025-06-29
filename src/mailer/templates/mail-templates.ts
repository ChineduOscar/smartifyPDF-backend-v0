export const verificationEmailHtml = (name: string, code: string) => `
  <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f7f7f7; border-radius: 8px;">
    <h2>Hello ${name}, 👋</h2>
    <p>Thanks for signing up on <strong>Afrilearn</strong>.</p>
    <p>Please use the code below to verify your email address:</p>

    <div style="font-size: 24px; font-weight: bold; background-color: #ffffff; padding: 12px 20px; border-radius: 6px; display: inline-block;">
      ${code}
    </div>

    <p style="margin-top: 20px;">
      This verification code will expire in <strong>10 minutes</strong>. Kindly enter it on the website to complete your registration.
    </p>

    <p style="margin-top: 30px;">
      Cheers,<br />
      <strong>The Afrilearn Team</strong>
    </p>
  </div>
`;

export const welcomeEmailHtml = (name: string) => `
  <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f7f7f7; border-radius: 8px;">
    <h2>Hello ${name}, 👋</h2>
    <p>Welcome to <strong>Afrilearn</strong>. We are excited to have you here.</p>
    <p>
      Afrilearn is on a mission to make learning African languages fun, simple, and accessible.
      Whether you are in the diaspora or in Africa and want to reconnect with your roots,
      or you are someone who wants to learn your mother tongue or explore another African language, we are here for you.
    </p>
    <p>
      Our learning experience combines the warmth of human instruction with the power of artificial intelligence,
      helping you learn in a natural, engaging, and personalized way, just like learning with a real teacher.
    </p>
    <a href="https://yourapp.com/dashboard" style="padding: 10px 20px; background-color: #28a745; color: white; text-decoration: none; border-radius: 6px;">
      Go to Dashboard
    </a>
    <p style="margin-top: 30px;">
      Enjoy your stay and have a great learning journey with us.<br />
      <strong>The Afrilearn Team</strong>
    </p>
  </div>
`;

export const resetPasswordEmailHTML = (resetLink: string) => `
  <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f7f7f7; border-radius: 8px;">
    <h2>Password Reset Request</h2>

    <p>Hello,</p>

    <p>
      We received a request to reset the password for your Afrilearn account associated with the email.
    </p>

    <p>
      To reset your password, please click the button below or paste the link into your browser:
    </p>

    <a href="${resetLink}" 
       style="display: inline-block; margin: 15px 0; padding: 10px 20px; background-color: #28a745; color: white; text-decoration: none; border-radius: 6px;">
      Reset Password
    </a>

    <p>
      This link will expire in <strong>15 minutes</strong> for your security.
      If you did not request a password reset, please ignore this email and your password will remain unchanged.
    </p>

    <p style="margin-top: 30px;">
      Thank you,<br />
      <strong>The Afrilearn Team</strong>
    </p>
  </div>
`;
