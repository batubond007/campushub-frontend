import {
  AboutSection,
  HeroSection,
  LandingFooter,
  TeamSection,
  UniversitySection,
} from '@/features/landing/sections'

// Public landing page: hero image, what CampusHub is, supported university and the team.
function HomePage() {
  return (
    <>
      <HeroSection />
      <AboutSection />
      <UniversitySection />
      <TeamSection />
      <LandingFooter />
    </>
  )
}

export default HomePage
