"use client";

import React, { useState } from "react";
import type { QuizQuestion } from "@/lib/chapters";

/** A friendly, forgiving quiz: kids retry until they get it right. Learning, not testing. */
export function Quiz({
  questions,
  accent,
  onAllCorrect,
}: {
  questions: QuizQuestion[];
  accent: string;
  onAllCorrect: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);

  const q = questions[index];

  function pick(i: number) {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.correct) setCorrectCount((c) => c + 1);
  }

  function next() {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setPicked(null);
    } else {
      onAllCorrect();
    }
  }

  const isCorrect = picked === q.correct;
  const done = picked !== null;

  return (
    <div className="quiz">
      <div className="quiz-progress">
        {questions.map((_, i) => (
          <span
            key={i}
            className={`quiz-dot ${i < index ? "done" : ""} ${i === index ? "now" : ""}`}
          />
        ))}
        <span className="quiz-count">
          第 {index + 1} / {questions.length} 题
        </span>
      </div>

      <h3 className="quiz-question">{q.q}</h3>

      <div className="quiz-options">
        {q.options.map((opt, i) => {
          let cls = "quiz-opt";
          if (done) {
            if (i === q.correct) cls += " right";
            else if (i === picked) cls += " wrong";
            else cls += " dim";
          }
          return (
            <button key={i} className={cls} onClick={() => pick(i)} disabled={done}>
              <span className="quiz-letter">{String.fromCharCode(65 + i)}</span>
              {opt}
            </button>
          );
        })}
      </div>

      {done && (
        <div className={`quiz-feedback ${isCorrect ? "good" : "oops"}`}>
          <div className="quiz-explain">
            {isCorrect ? "🎉 太棒了！" : "🌱 再想一想～"} {q.explain}
          </div>
          {isCorrect && (
            <button className="btn" style={{ background: accent }} onClick={next}>
              {index + 1 < questions.length ? "下一题 →" : "完成挑战 ✦"}
            </button>
          )}
        </div>
      )}
      <p className="quiz-hint">答错没关系，选对即可继续 —— 学习本来就该这样。</p>
    </div>
  );
}
