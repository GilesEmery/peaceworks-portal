"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "../../lib/supabase";
import {
  peaceAssessmentQuestions,
  type PeaceAssessmentQuestion,
} from "../../data/peaceAssessmentQuestions";
import {
  calculatePeaceAssessmentResult,
  type AssessmentAnswers,
  type PeaceAssessmentResult,
} from "../../lib/peaceAssessmentScoring";

import SiteHeader from "../../components/layout/SiteHeader";
import SiteFooter from "../../components/layout/SiteFooter";

import QuestionCard from "../../components/assessment/QuestionCard";
import ProgressBar from "../../components/assessment/ProgressBar";
import ResultModal from "../../components/assessment/ResultModal";
import { peaceAssessmentProfiles } from "../../data/peaceAssessmentProfiles";
import { buildPeaceReportProfile } from "../../data/peaceReport";
import { routes } from "../../lib/navigation";

type PeaceAssessmentRow = {
  scores: PeaceAssessmentResult["scores"];
  identity_type: PeaceAssessmentResult["identityType"];
  secondary_identity_type?: PeaceAssessmentResult["identityType"] | null;
  response_type: PeaceAssessmentResult["responseType"];
  processing_style: PeaceAssessmentResult["processingStyle"];
  capacity_stage: PeaceAssessmentResult["capacityStage"];
  peace_profile: string;
  base_pattern: string;
  created_at: string | null;
};

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
  const [assessmentStarted, setAssessmentStarted] = useState(false);
  const [latestResult, setLatestResult] = useState<PeaceAssessmentRow | null>(
    null
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AssessmentAnswers>({});
  const [message, setMessage] = useState("");
  const [resultData, setResultData] = useState<PeaceAssessmentResult | null>(
    null
  );

  useEffect(() => {
    async function loadAssessmentStatus() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setLoading(false);
        return;
      }

      setUserEmail(session.user.email || "");
      setUserId(session.user.id);

      const { data, error } = await supabase
        .from("peace_assessment_results")
        .select(
          "scores, identity_type, secondary_identity_type, response_type, processing_style, capacity_stage, peace_profile, base_pattern, created_at"
        )
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Unable to load Peace Assessment status.", error);
      }

      if (data) {
        setLatestResult(data as PeaceAssessmentRow);
      }

        setLoading(false);
    }

    loadAssessmentStatus();
  }, []);

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

  function startAssessment() {
    if (!userId) {
      router.push(routes.login);
      return;
    }

    setAssessmentStarted(true);
  }

  function openLatestResult() {
    if (!latestResult) return;

    const secondaryIdentityType =
      latestResult.secondary_identity_type ||
      getSecondaryIdentityType(latestResult.scores, latestResult.identity_type);
    const expandedProfile = buildPeaceReportProfile({
      identityAnchor: latestResult.identity_type,
      secondaryPeaceStrategy: secondaryIdentityType,
      pressureResponse: latestResult.response_type,
      processingStyle: latestResult.processing_style,
    });
    const profileKey = `${latestResult.identity_type}|${latestResult.response_type}|${latestResult.processing_style}`;
    const profileContent = peaceAssessmentProfiles[profileKey];

    setResultData({
      scores: latestResult.scores,
      identityType: latestResult.identity_type,
      secondaryIdentityType,
      responseType: latestResult.response_type,
      processingStyle: latestResult.processing_style,
      capacityStage: latestResult.capacity_stage,
      peaceProfile: expandedProfile?.title || latestResult.peace_profile,
      basePattern: latestResult.base_pattern,
      profileContent,
    });
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

  if (!assessmentStarted) {
    return (
      <main className="portal-page">
        <div className="assessment-static-header">
          <SiteHeader />
        </div>

        <section className="peace-assessment-landing">
          <div className="container">
            <div className="peace-assessment-landing-card">
              <div>
                <div className="eyebrow">PeaceWorks Assessments</div>
                <h1>Peace Assessment</h1>
                <p>
                  Discover how you seek, lose, protect, and restore peace when
                  pressure rises. Your results give you a personalized profile,
                  reflection language, and practices for growth.
                </p>
              </div>

              <div className="peace-assessment-benefits">
                <div>
                  <strong>Your peace anchors</strong>
                  <span>
                    See the needs and strategies that help you feel grounded.
                  </span>
                </div>
                <div>
                  <strong>Your pressure response</strong>
                  <span>
                    Recognize whether you tend to please, prove, push, or pull
                    away.
                  </span>
                </div>
                <div>
                  <strong>Your relational impact</strong>
                  <span>
                    Explore strengths, growth edges, and practices for your
                    relationships.
                  </span>
                </div>
              </div>

              <div className="peace-assessment-actions">
                {!userId ? (
                  <>
                    <button
                      className="btn btn-primary"
                      type="button"
                      onClick={() => router.push(routes.login)}
                    >
                      Sign In to Begin
                    </button>
                    <button
                      className="btn btn-secondary"
                      type="button"
                      onClick={() => router.push(routes.login)}
                    >
                      Create an Account to Begin
                    </button>
                  </>
                ) : latestResult ? (
                  <>
                    <button
                      className="btn btn-primary"
                      type="button"
                      onClick={openLatestResult}
                    >
                      View Results
                    </button>
                    <button
                      className="btn btn-secondary"
                      type="button"
                      onClick={startAssessment}
                    >
                      Retake Assessment
                    </button>
                  </>
                ) : (
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={startAssessment}
                  >
                    Start Assessment
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <SiteFooter />

        {resultData && (
          <ResultModal
            result={resultData}
            onClose={() => setResultData(null)}
            onGoToDashboard={() => router.push(routes.myDashboard)}
          />
        )}
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
          onGoToDashboard={() => router.push(routes.myDashboard)}
        />
      )}
    </main>
  );
}

function getSecondaryIdentityType(
  scores: PeaceAssessmentResult["scores"],
  primary: PeaceAssessmentResult["identityType"]
) {
  const entries = (["Performance", "Prestige", "Prosperity"] as const)
    .filter((key) => key !== primary)
    .map((key) => [key, scores[key]] as const)
    .sort(([, a], [, b]) => b - a);

  return entries[0]?.[0] || primary;
}
