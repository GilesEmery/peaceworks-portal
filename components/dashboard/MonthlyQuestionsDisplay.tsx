import type { MemberMonthlyQuestion } from "../../lib/coach/monthlyQuestions";

export default function MonthlyQuestionsDisplay({
  questions,
}: {
  questions: MemberMonthlyQuestion[];
}) {
  if (questions.length === 0) {
    return (
      <section className="monthly-question-member-card portal-card">
        <span className="card-label">This Month&apos;s Question</span>
        <h2>No monthly question has been published for your Circle yet.</h2>
      </section>
    );
  }

  return (
    <section className="monthly-question-member-list" aria-label="Monthly Questions">
      {questions.map((question) => (
        <article className="monthly-question-member-card portal-card" key={`${question.circle.id}-${question.id}`}>
          <span className="card-label">{question.circle.name}</span>
          <h2>{question.title || "This Month's Question"}</h2>
          {question.openingReflection && <p>{question.openingReflection}</p>}
          <blockquote>{question.questionText}</blockquote>
          {question.guidance && <p>{question.guidance}</p>}
          {question.discussionPrompts.length > 0 && (
            <ul>
              {question.discussionPrompts.map((prompt) => (
                <li key={prompt}>{prompt}</li>
              ))}
            </ul>
          )}
        </article>
      ))}
    </section>
  );
}
