type QuestionComposerProps = {
  question: string;
  onQuestionChange: (value: string) => void;
  onRecommend: () => void;
};

export function QuestionComposer({ question, onQuestionChange, onRecommend }: QuestionComposerProps) {
  return (
    <section className="panel composer" aria-labelledby="question-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">问题</p>
          <h1 id="question-title">多专家圆桌</h1>
        </div>
        <button className="primary-action" type="button" onClick={onRecommend}>
          推荐 Top 3
        </button>
      </div>
      <textarea
        aria-label="输入要讨论的问题"
        value={question}
        onChange={(event) => onQuestionChange(event.target.value)}
        placeholder="例如：我想做一个 AI 教育产品，如何验证需求、控制风险并设计第一版？"
      />
    </section>
  );
}
