import { Injectable } from '@nestjs/common';
import * as Handlebars from 'handlebars';
import * as sgMail from '@sendgrid/mail';
import * as fs from 'fs';

@Injectable()
export class EmailService {
  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  }
  async sendActivationEmail(user) {
    if (user && !user.isActive) {
      const link = `${process.env.API_URL}/verify-account?activationKey=${user.activationKey}`;
      const finalHtml = await this.getInterpolatedEmailContent('welcome.html', {
        link,
      });
      const msg = {
        to: user.email,
        from: 'support@continuem.co',
        subject: 'Welcome to Continuem;',
        html: finalHtml,
      };
      await this.sendEmail(msg);
    }
  }
  async sendEmail(msg) {
    await (async () => {
      try {
        await sgMail.send(msg);
      } catch (error) {
        console.error(error);

        if (error.response) {
          console.error(error.response.body);
        }
      }
    })();
  }
  async getInterpolatedEmailContent(template, data) {
    try {
      const contents = fs.readFileSync(
        `src/emails/templates/${template}`,
        'utf8',
      );
      const compiledTemplate = Handlebars.compile(contents);
      return compiledTemplate({
        ...data,
      });
    } catch (err) {
      console.error(err);
    }
  }
}
