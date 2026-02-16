import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { ROLE_POINTS, ROLE_BENEFITS } from "@/content/site";
import Image from "next/image";
import avatar from "@/components/video/image1.webp";

export const RoleSection = () => (
  <section id="accompagnement" className="container scroll-mt-24 py-12 space-y-8">
    <SectionHeader
      kicker="Mon rôle"
      title="Je prends tout en charge pour vous"
      subtitle="Gabriel Perbost, courtier indépendant : je gère dossier, négociations et conformité jusqu’à la mise en place."
    />

    <Card className="p-5 sm:p-6 lg:p-7">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 flex-shrink-0 rounded-full overflow-hidden border border-white/60 shadow-soft">
            <Image
              src={avatar}
              alt="Portrait Gabriel Perbost"
              width={64}
              height={64}
              className="h-full w-full object-cover object-top"
              priority
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-primary uppercase tracking-wide">Mon rôle</p>
            <p className="text-base font-semibold text-ink">Je m’occupe de tout, vous payez moins.</p>
            <p className="text-sm text-muted">
              Vous ne faites rien. Je m’occupe de tout. Vous payez moins.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-4 border-slate-100 shadow-none bg-slate-50">
            <h3 className="text-sm font-semibold text-ink mb-3 uppercase tracking-wide">Ce que je fais</h3>
            <ul className="space-y-2 text-sm text-muted">
              {ROLE_POINTS.map((item) => (
                <li key={item} className="flex gap-2 items-start">
                  <span className="mt-1 inline-flex h-3 w-3 rounded-full bg-gradient-to-br from-primary to-emerald-400 shadow-soft" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-4 border-slate-100 shadow-none bg-white">
            <h3 className="text-sm font-semibold text-ink mb-3 uppercase tracking-wide">Ce que vous gagnez</h3>
            <ul className="space-y-2 text-sm text-muted">
              {ROLE_BENEFITS.map((item) => (
                <li key={item} className="flex gap-2 items-start">
                  <span className="mt-1 inline-flex h-3 w-3 rounded-full bg-gradient-to-br from-primary to-emerald-400 shadow-soft" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </Card>
  </section>
);
