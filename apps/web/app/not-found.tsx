import Link from 'next/link';
import { Screen } from '@/components/Screen';

export default function NotFound() {
  return (
    <Screen tone="c">
      <div className="pad">
        <span className="logo">foodplanr</span>
        <p className="num" style={{ marginTop: 'auto' }}>
          404
        </p>
        <p className="p">Den side findes ikke.</p>
        <Link href="/" className="btn" style={{ marginTop: 'auto' }}>
          Til forsiden →
        </Link>
      </div>
    </Screen>
  );
}
