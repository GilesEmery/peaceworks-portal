import type {
  PeaceAssessmentQuestion,
  QuestionOption,
} from "../../data/peaceAssessmentQuestions";

type QuestionCardProps = {
  question: PeaceAssessmentQuestion;
  answer: any;
  onAnswer: (answer: any) => void;
};

export default function QuestionCard({
  question,
  answer,
  onAnswer,
}: QuestionCardProps) {
  if (question.type === "slider") {
    const value = answer?.value ?? 50;

    return (
      <div className="question-card">
        <p className="scenario">{question.scenario}</p>
        <h2 className="question-title">{question.prompt}</h2>

        <div className="slider-shell">
          <div className="slider-labels">
            <div className="slider-label">
              <strong>{question.left?.title}</strong>
              <span>{question.left?.text}</span>
            </div>

            <div className="slider-label">
              <strong>{question.right?.title}</strong>
              <span>{question.right?.text}</span>
            </div>
          </div>

          <input
            className="peace-slider"
            type="range"
            min="0"
            max="100"
            value={value}
            onChange={(e) =>
              onAnswer({
                value: Number(e.target.value),
                touched: true,
                capacity: question.capacity,
              })
            }
          />

          <div className="slider-value">{sliderText(value)}</div>
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
          Choose {question.max}. Selected choices turn dark. You can change them
          before clicking Next.
        </p>

        <div className="answers-grid choose-grid">
          {question.options?.map((option) => {
            const isSelected = selected.some((item) => item.id === option.id);

            return (
              <button
                key={option.id}
                type="button"
                className={`answer-card choose-card ${
                  isSelected ? "selected" : ""
                }`}
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

      <div className={question.type === "truefalse" ? "tf-grid" : "answers-grid"}>
        {question.options?.map((option, index) => {
          const isSelected = answer?.id === option.id;

          return (
            <button
              key={option.id}
              type="button"
              className={`answer-card ${
                question.type === "truefalse" ? "tf-card" : ""
              } ${isSelected ? "selected" : ""}`}
              onClick={() => onAnswer(option)}
            >
              <span className="answer-letter">
                {question.type === "truefalse"
                  ? "✓"
                  : String.fromCharCode(65 + index)}
              </span>

              <span className="answer-text">{option.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function sliderText(value: number) {
  if (value < 25) return "Strongly toward the left";
  if (value < 45) return "Somewhat toward the left";
  if (value <= 55) return "A mix of both";
  if (value < 75) return "Somewhat toward the right";
  return "Strongly toward the right";
}