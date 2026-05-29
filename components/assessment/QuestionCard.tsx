import type {
  PeaceAssessmentQuestion,
  QuestionOption,
} from "../../data/peaceAssessmentQuestions";

type QuestionCardProps = {
  question: PeaceAssessmentQuestion;
  answer: any;
  onAnswer: (answer: any) => void;
};

const likertOptions = [
  { label: "Very Unlike Me", value: 0 },
  { label: "Unlike Me", value: 25 },
  { label: "Neutral", value: 50 },
  { label: "Like Me", value: 75 },
  { label: "Very Like Me", value: 100 },
];

export default function QuestionCard({
  question,
  answer,
  onAnswer,
}: QuestionCardProps) {
  if (question.type === "slider") {
    const value = answer?.value;

    return (
      <div className="question-card">
        <p className="scenario">{question.scenario}</p>
        <h2 className="question-title">{question.prompt}</h2>

        <p className="choose-note">Choose the response that best describes you right now.</p>

        <div className="likert-grid">
          {likertOptions.map((option, index) => {
            const isSelected = value === option.value;

            return (
              <button
                key={option.label}
                type="button"
                className={`likert-card ${isSelected ? "selected" : ""}`}
                onClick={() =>
                  onAnswer({
                    value: option.value,
                    touched: true,
                    capacity: question.capacity,
                  })
                }
              >
                <span className="likert-number">{index + 1}</span>
                <span className="likert-label">{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (question.type === "choose2") {
    const selected: QuestionOption[] = answer?.selected ?? [];

    function toggleOption(option: QuestionOption) {
      const exists = selected.some((item) => item.id === option.id);

      if (exists) {
        onAnswer({
          selected: selected.filter((item) => item.id !== option.id),
        });
        return;
      }

      if (selected.length < (question.max ?? 2)) {
        onAnswer({
          selected: [...selected, option],
        });
      }
    }

    return (
      <div className="question-card">
        <p className="scenario">{question.scenario}</p>
        <h2 className="question-title">{question.prompt}</h2>

        <p className="choose-note">
          Choose {question.max}. Selected choices turn dark. You can change them before clicking Next.
        </p>

        <div className="answers-grid choose-grid">
          {question.options?.map((option) => {
            const isSelected = selected.some((item) => item.id === option.id);

            return (
              <button
                key={option.id}
                type="button"
                className={`answer-card choose-card ${isSelected ? "selected" : ""}`}
                onClick={() => toggleOption(option)}
              >
                <span className="answer-letter">✓</span>
                <span className="answer-text">{option.text}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="question-card">
      <p className="scenario">{question.scenario}</p>
      <h2 className="question-title">{question.prompt}</h2>

      <p className="choose-note">
        {question.type === "truefalse" ? "Choose the response that best describes you." : "Select one response."}
      </p>

      <div className={question.type === "truefalse" ? "tf-grid" : "answers-grid"}>
        {question.options?.map((option, index) => {
          const isSelected = answer?.id === option.id;

          return (
            <button
              key={option.id}
              type="button"
              className={`answer-card ${question.type === "truefalse" ? "tf-card" : ""} ${
                isSelected ? "selected" : ""
              }`}
              onClick={() => onAnswer(option)}
            >
              <span className="answer-letter">
                {question.type === "truefalse" ? "✓" : String.fromCharCode(65 + index)}
              </span>

              <span className="answer-text">{option.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}