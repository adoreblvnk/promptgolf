import { notFound } from "next/navigation";
import { ChallengeWorkbench } from "@/components/promptgolf/challenge-workbench";
import { WorkbenchShell } from "@/components/promptgolf/chrome";
import { PromptRunner } from "@/components/promptgolf/prompt-runner";
import { challenges, getChallenge } from "@/lib/promptgolf";

export function generateStaticParams() {
  return challenges.map((challenge) => ({ slug: challenge.slug }));
}

export default async function ChallengePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const challenge = getChallenge(slug);
  if (!challenge) notFound();
  const index = challenges.findIndex((item) => item.slug === challenge.slug);
  const previous = challenges[index - 1];
  const next = challenges[index + 1];

  return (
    <WorkbenchShell>
      <ChallengeWorkbench
        challenge={challenge}
        number={index + 1}
        previousHref={previous ? `/challenges/${previous.slug}` : undefined}
        nextHref={next ? `/challenges/${next.slug}` : undefined}
        editor={challenge.status === "live" ? <PromptRunner challengeSlug={challenge.slug} /> : <PreviewEditor framework={challenge.framework} artifact={challenge.artifact} />}
      />
    </WorkbenchShell>
  );
}

function PreviewEditor({ framework, artifact }: { framework: string; artifact: string }) {
  return (
    <div className="grid min-h-0 flex-1 place-items-center p-6">
      <div className="max-w-sm rounded border border-dashed border-rule bg-card p-5 text-center">
        <p className="text-sm font-medium text-ink">Submissions open after adapter verification</p>
        <p className="mt-2 text-[12px] leading-5 text-ink-muted">The {framework} {artifact} brief is available to study, but this preview problem does not simulate an executable run.</p>
      </div>
    </div>
  );
}
