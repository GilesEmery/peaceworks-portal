"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "../../lib/supabase";
import {
  peaceAssessmentQuestions,
  type PeaceAssessmentQuestion,
} from "../../data/peaceAssessmentQuestions";
import { calculatePeaceAssessmentResult } from "../../lib/peaceAssessmentScoring";

import SiteHeader from "../../components/layout/SiteHeader";
import SiteFooter from "../../components/layout/SiteFooter";

import QuestionCard from "../../components/assessment/QuestionCard";
import ProgressBar from "../../components/assessment/ProgressBar";
import ResultModal from "../../components/assessment/ResultModal";

function shuffleArray<T>(items: T[]): T[] {
  const shuffled = [...items];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

function prepareAssessmentQuestions() {
  const regularQuestions = peaceAssessmentQuestions.filter(
    (question) => !question.tieBreaker
  );

  const tieBreakerQuestions = peaceAssessmentQuestions.filter(
    (question) => question.tieBreaker
  );

  const randomizedRegularQuestions = shuffleArray(regularQuestions).map(
    (question) => ({
      ...question,
      options: question.options ? shuffleArray(question.options) : question.options,
    })
  );

  const randomizedTieBreakers = tieBreakerQuestions.map((question) => ({
    ...question,
    options: question.options ? shuffleArray(question.options) : question.options,
  }));

  return [...randomizedRegularQuestions, ...randomizedTieBreakers];
}

export default function PeaceAssessmentPage() {
  const router = useRouter();

  const assessmentQuestions = useMemo(() => prepareAssessmentQuestions(), []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [message, setMessage] = useState("");
  const [resultData, setResultData] = useState<any>(null);

  useEffect(() => {
    async function checkUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/auth");
      } else {
        setUserEmail(session.user.email || "");
        setUserId(session.user.id);
        setLoading(false);
      }
    }

    checkUser();
  }, [router]);

  const currentQuestion: PeaceAssessmentQuestion =
    assessmentQuestions[currentIndex];

  const totalQuestions = assessmentQuestions.length;

  function isAnswered() {
    const answer = answers[currentQuestion.id];

    if (!answer) return false;

    if (currentQuestion.type === "choose2") {
      return answer.selected?.length === currentQuestion.max;
    }

    if (currentQuestion.type === "slider") {
      return answer.touched === true;
    }

    return !!answer.id;
  }

  async function handleNext() {
    setMessage("");

    if (!isAnswered()) {
      setMessage("Please answer this question before moving forward.");
      return;
    }

    if (currentIndex === totalQuestions - 1) {
      await saveAssessmentResult();
      return;
    }

    setCurrentIndex((prev) => prev + 1);
  }

  async function saveAssessmentResult() {
    setSaving(true);
    setMessage("Saving your Peace Assessment result...");

    const result = calculatePeaceAssessmentResult(
      answers,
      peaceAssessmentQuestions
    );

    const { error } = await supabase
      .from("peace_assessment_results")
      .insert([
        {
          user_id: userId,
          peace_profile: result.peaceProfile,
          base_pattern: result.basePattern,
          identity_type: result.identityType,
          secondary_identity_type: result.secondaryIdentityType,
          response_type: result.responseType,
          processing_style: result.processingStyle,
          capacity_stage: result.capacityStage,
          scores: result.scores,
          answers,
        },
      ]);

    if (error) {
      console.error(error);
      setMessage("Something went wrong while saving your result.");
      setSaving(false);
      return;
    }

    setResultData(result);
    setMessage("Your Peace Assessment result has been saved.");
    setSaving(false);
  }

  function handleBack() {
    setMessage("");
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }

  function restartAssessment() {
    if (confirm("Restart the Peace Assessment?")) {
      setAnswers({});
      setCurrentIndex(0);
      setMessage("");
      setResultData(null);
    }
  }

  if (loading) {
    return (
      <main className="portal-page">
        <div className="assessment-static-header">
  <SiteHeader />
</div>

        <section className="portal-hero">
          <div className="container">Loading the Peace Assessment...</div>
        </section>

        <SiteFooter />
      </main>
    );
  }

  return (
    <main className="portal-page">
      <div className="assessment-static-header">
  <SiteHeader />
</div>

      <section className="assessment-shell active">
        <div className="container">
          <div className="assessment-panel">
            <div className="assessment-top">
              <div>
                <div className="assessment-kicker">Peace Assessment</div>

                <div className="assessment-count">
                  Question {currentIndex + 1} of {totalQuestions}
                </div>
              </div>

              <p className="mini-note">Signed in as {userEmail}</p>
            </div>

            <ProgressBar current={currentIndex + 1} total={totalQuestions} />

            <QuestionCard
              question={currentQuestion}
              answer={answers[currentQuestion.id]}
              onAnswer={(answer) =>
                setAnswers((prev) => ({
                  ...prev,
                  [currentQuestion.id]: answer,
                }))
              }
            />

            {message && <div className="toast show">{message}</div>}

            <div className="assessment-actions">
              <button
                className="btn btn-secondary"
                type="button"
                onClick={handleBack}
                disabled={currentIndex === 0 || saving}
              >
                Back
              </button>

              <button
                className="btn btn-secondary"
                type="button"
                disabled={saving}
                onClick={restartAssessment}
              >
                Restart
              </button>

              <button
                className="btn btn-primary"
                type="button"
                onClick={handleNext}
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : currentIndex === totalQuestions - 1
                  ? "Save My Result"
                  : "Next"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />

      {resultData && (
        <ResultModal
          result={resultData}
          onClose={() => setResultData(null)}
          onGoToDashboard={() => router.push("/dashboard")}
        />
      )}
    </main>
  );
}
