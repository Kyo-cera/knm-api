import axios from "axios";
import dotenv from 'dotenv'; // Modificato require in import
import { Request, Response } from 'express'; // Aggiunto import mancante
import fs from 'fs';
import Joi from "joi";
import emailServices from '../services/emailService';
import { sendError } from '../utils/requestHandlers';
dotenv.config();
const scopes = ['https://graph.microsoft.com/.default'];
const EMAIL_URL = `https://graph.microsoft.com/v1.0/users/${process.env.MAIL_SENDER}/sendMail`;

class Mails {
    static sendMail = async (req: Request, res: Response) => {
        try {
           // console.log('richiesta  send email');
            const { recipient, subject, emailBody,attachment } = req.body;
            const schema = Joi.object({
                recipient: Joi.string().email().required(),
                subject: Joi.string().required(),
                emailBody: Joi.string().required(),
                attachment:Joi.string().required()
            });
            const { error } = schema.validate(req.body); // Destructuring per ottenere direttamente error
            if (error) {
                return res.status(400).send(error.details[0].message);
            }
            const accessToken = await emailServices.generateGraphApiAccessToken();
          //  const accessToken = process.env.TOKENMSG;
           // console.log('accessToken ms: ', accessToken);
            const filePath = `${process.env.FILES}${attachment}`;
            const fileContent = fs.readFileSync(filePath);
            const base64data = fileContent.toString('base64');
            const emailConfig = {
                Message: {
                    Subject: subject,
                    Body: {
                        ContentType: 'HTML',
                        Content: emailBody
                    },
                    ToRecipients: [
                        {
                            EmailAddress: {
                                Address: recipient
                            }
                        }
                    ],
                    from: {
                        emailAddress: {
                            address: process.env.MAIL_SENDER
                        }
                    },
                    "attachments": [
                        {
                            "@odata.type": "#microsoft.graph.fileAttachment",
                            "name": attachment,
                            "contentType": 'application/xlsx',
                            "contentBytes": base64data
                        }
                    ]
                },
                SaveToSentItems: 'false'
            };
            await axios.post(EMAIL_URL, emailConfig, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            return res.status(200).send({
                status: 'success',
                message: 'Email with attachment sent successfully'
                
            },
           
        );
        } catch (error: any) {
            sendError( res,error.message);
        }
    }
}

export default Mails;