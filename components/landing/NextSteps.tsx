import { Button } from "@/components/ui/Button";
import styles from "./landing.module.css";

const faqs = [
  { q: "Who can rent a car?", a: "Create a renter account to explore this demo. In a live marketplace, drivers would need a valid license and meet eligibility requirements." },
  { q: "What is included in the price?", a: "Your total includes the daily rate and a service fee. Every amount is shown in birr (ETB) before you book." },
  { q: "Is this a real booking?", a: "No. Payments are mocked (a pretend TeleBirr checkout) and tracking is simulated; no real charge is made." },
];

export function NextSteps() {
  return (
    <section className={styles.next} aria-label="Hosting, questions and next steps">
      <div className={styles.owner}>
        <div className={styles.ownerCopy}>
          <p className={styles.ownerEyebrow}>YOUR CAR CAN GO PLACES, TOO.</p>
          <h2 className={styles.ownerTitle}>Put your parked car to good use.</h2>
          <p className={styles.ownerBody}>
            Share it on your schedule, meet great people, and earn on the days you don’t need the keys.
          </p>
          <Button href="/owner/cars/new" variant="amber">
            List your car
          </Button>
          <p className={styles.ownerNote}>You set the price. You choose the availability.</p>
        </div>
        <div className={`${styles.ownerPhoto} photo-placeholder`} role="img" aria-label="Host with their car" />
      </div>

      <div>
        <h2 className={styles.faqTitle} style={{ marginBottom: 24 }}>
          A few things worth knowing.
        </h2>
        <div className={styles.faq}>
          {faqs.map((f) => (
            <details key={f.q} className={styles.faqItem}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </div>

      <div className={styles.final}>
        <h2>Where will your next drive take you?</h2>
        <Button href="/cars" variant="amber">
          Find your car →
        </Button>
      </div>
    </section>
  );
}
