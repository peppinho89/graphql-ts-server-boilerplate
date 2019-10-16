import * as SparkPost from "sparkpost";
const sparky = new SparkPost(process.env.SPARKPOST_API_KEY || "dummy");

export const sendEmail = async (recipients: string, url: string) => {
  const response = await sparky.transmissions.send({
    options: { sandbox: true },
    content: {
      from: "testing@sparkpostbox.com",
      subject: "Confirm Email",
      html: `<html>
        <body>
        <p>Testing SparkPost - the most awesomest email service!</p>
        <a href="${url}">Click here to confirm</a>
        </body>
        </html>`
    },
    recipients: [{ address: recipients }]
  });

  console.log(response);
};
