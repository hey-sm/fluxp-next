import { HomeTopNav } from '@/components/home/home-top-nav'
import { HomeWeatherStatus } from '@/components/home/home-weather-status'
import { LightRays } from '@/components/ui/light-rays'
import { PixelHeading } from '@/components/ui/pixel-heading-character'
import { fetchWeatherFromIp } from '@/lib/weather'
import SplitText from '@/components/ui/SplitText'

export default async function Home() {
  const initialWeather = await fetchWeatherFromIp().catch(() => null)

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f4f8ff_42%,#f8fbff_100%)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.98),rgba(241,247,255,0.82)_34%,rgba(240,247,255,0.34)_58%,transparent_76%)]" />
      <LightRays
        className="absolute inset-0"
        color="rgba(132, 188, 255, 0.24)"
        blur={42}
        opacity={0.72}
        speed={15}
        length="76vh"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.56),transparent_42%)]" />

      <HomeTopNav />

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 pb-20 sm:px-8">
        <section className="flex flex-col items-center pt-20 text-center sm:pt-28">
          <PixelHeading
            autoPlay
            mode="multi"
            cycleInterval={350}
            staggerDelay={20}
            className="text-[clamp(3rem,8vw,6rem)] leading-none tracking-[-0.06em] text-slate-900"
          >
            Welcome to fluxp
          </PixelHeading>
          <HomeWeatherStatus className="mt-5" initialWeather={initialWeather} />
        </section>

        <section className="mt-auto flex justify-center pt-16 pb-6 sm:pt-20">
          <SplitText
            text="悟已往之不谏，知来者之可追。实迷途其未远，觉今是而昨非。"
            delay={50}
            duration={1.25}
            ease="power3.out"
            splitType="chars"
            from={{ opacity: 0, y: 40 }}
            to={{ opacity: 1, y: 0 }}
            threshold={0.1}
          />
        </section>
      </main>
    </div>
  )
}
