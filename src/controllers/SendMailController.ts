import { Request, response, Response } from 'express';
import { getCustomRepository } from 'typeorm';
import { SurveyRepository } from '../repositories/SurveyRepository';
import { UsersRepository } from '../repositories/UsersRepository';
import { SurveyUserRepository } from '../repositories/SurveyUserRepository';
import SendMailService from '../services/SendMailService';

class SendMailController {

    async execute(request: Request, response: Response) {
        const { email, survey_id } = request.body;
        const usersRepository = getCustomRepository(UsersRepository);
        const surveyRepository = getCustomRepository(SurveyRepository);
        const surveyUserRepository = getCustomRepository(SurveyUserRepository);

        const userAlreadyExists = await usersRepository.findOne({ email });
        if (!userAlreadyExists) {
            return response.status(400).json({
                error: "User does not exists",
            });
        }

        const surveyAlreadyExists = await surveyRepository.findOne({
            id: survey_id
        });

        if (!surveyAlreadyExists) {
            return response.status(400).json({
                error: "Survey does not exists"
            });
        }

        const surveyUser = surveyUserRepository.create({
            survey_id: String(survey_id),
            user_id: String(userAlreadyExists.id),
        });

        await surveyUserRepository.save(surveyUser);

        const npsPath = resolve(__dirname, "..", "views", "emails", "npsMail.hbs");

        const mailVars = {
            name: userAlreadyExists.name,
            title: surveyAlreadyExists.title,
            description: surveyAlreadyExists.description,
        };

        await SendMailService.execute(
            userAlreadyExists.email,
            "Queremos ouvir sua opinião",
            mailVars,
            npsPath
        )

        return response.json(surveyUser);
    }
}

export { SendMailController };