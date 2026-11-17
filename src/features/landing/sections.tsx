import { FEATURES, TEAM } from '@/features/landing/content'
import '@/features/landing/landing.css'
import { Link } from '@/lib/router'

export function HeroSection() {
  return (
    <section className="hero" aria-label="CampusHub">
      <img
        className="hero-image"
        src="/images/campushub-hero.webp"
        width={1920}
        height={1080}
        alt="Students at ODTÜ using CampusHub for events, study groups, lost and found, clubs and a second-hand marketplace."
      />
    </section>
  )
}

export function AboutSection() {
  return (
    <section id="about" className="landing-section">
      <p className="eyebrow" lang="en">What is CampusHub?</p>
      <h1 className="landing-title">Your whole campus life, in one place.</h1>
      <p className="lead">
        CampusHub is a platform made only for verified university students. Instead of following dozens of
        group chats, posters and notice boards, you can see what is happening on campus, connect with other
        students and take part — all from one app. Sign up with your university e-mail, set up your profile
        and start exploring.
      </p>
      <ul className="feature-grid">
        {FEATURES.map((feature) => (
          <li key={feature.title} className="feature-card">
            <h2>{feature.title}</h2>
            <p className="muted">{feature.text}</p>
          </li>
        ))}
      </ul>
      <div className="cta-row">
        <Link to="/signup" className="button primary">Create your account</Link>
        <Link to="/login" className="button">Log in</Link>
      </div>
    </section>
  )
}

export function UniversitySection() {
  return (
    <section id="university" className="landing-section">
      <div className="university-card">
        <div className="university-badge" aria-hidden="true">ODTÜ</div>
        <div>
          <h2>Now available at ODTÜ</h2>
          <p className="muted">
            CampusHub currently works only with <strong>Middle East Technical University (ODTÜ / METU)</strong>.
            You can sign up with your <strong>@metu.edu.tr</strong> e-mail address. More universities are coming soon.
          </p>
        </div>
      </div>
    </section>
  )
}

function initials(name: string) {
  const parts = name.split(' ')
  return (parts[0][0] + parts[parts.length - 1][0]).toLocaleUpperCase('tr-TR')
}

export function TeamSection() {
  return (
    <section id="team" className="landing-section">
      <p className="eyebrow" lang="en">Team</p>
      <h2 className="landing-title">The people behind CampusHub</h2>
      <ul className="team-grid">
        {TEAM.map((name) => (
          <li key={name} className="team-card">
            <span className="avatar" aria-hidden="true">{initials(name)}</span>
            <span className="team-name">{name}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function LandingFooter() {
  return (
    <footer className="landing-footer muted">
      © {new Date().getFullYear()} CampusHub · Made for ODTÜ students
    </footer>
  )
}
