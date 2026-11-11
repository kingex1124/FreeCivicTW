import type { Quiz, QuizFeedback } from '@/Model/LearningModel';
import type { Scenario } from '@/Model/MediaLiteracyModel';
export const ExerciseService = {
  evaluate(quiz: Quiz, optionId: string): QuizFeedback {
    const choice = quiz.options.find((o) => o.id === optionId);
    if (!choice) throw new Error('請選擇題目提供的選項。');
    return {
      correct: optionId === quiz.correctOptionId,
      explanation: choice.explanation,
      correctText: quiz.options.find((o) => o.id === quiz.correctOptionId)?.text ?? '',
    };
  },
  fromScenario(scenario: Scenario): Quiz {
    return {
      question: scenario.question,
      correctOptionId: scenario.correctOptionId,
      options: scenario.options.map((o) => ({
        ...o,
        explanation: scenario.optionExplanations[o.id],
      })),
    };
  },
};
