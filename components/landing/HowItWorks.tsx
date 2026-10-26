import { Button } from "@/components/ui/Button";
import styles from "./landing.module.css";

const steps = [
  { n: "01", title: "Find your fit", body: "City compact or coastal cruiser? Find a car that fits your plans." },
  { n: "02", title: "Make it yours", body: "Choose your dates, meet your host, and book with clear pricing." },
  { n: "03", title: "Take the scenic route", body: "Pick up the keys, settle in, and enjoy the journey." },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className={styles.how} aria-labelledby="how-title">
      <h2 id="how-title" className={styles.sectionTitle}>
        Find. Book. Drive.
      </h2>
      <ol className={styles.steps} style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {steps.map((s) => (
          <li key={s.n} className={styles.step}>
            <h3>
              <span className={styles.stepNum}>{s.n}</span>
              {s.title}
            </h3>
            <p>{s.body}</p>
          </li>
        ))}
      </ol>
      <div className={styles.story}>
        <div className={`${styles.storyPhoto} photo-placeholder`} role="img" aria-label="Coastal destination" />
        <div className={styles.storyCopy}>
          <p className="eyebrow">Go a little further</p>
          <h2 className={styles.sectionTitle}>There’s a weekend with your name on it.</h2>
          <p className={styles.sectionLead}>
            Coffee in the city, lakes by the afternoon. Start in Addis Ababa and see where the road takes you.
          </p>
          <Button href="/cars" variant="secondary">
            Explore Addis cars →
          </Button>
        </div>
      </div>
    </section>
  );
}
