import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'firn — simulated property investment experience';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 76, background: '#08141D', color: '#EAF3F6', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, width: 70 }}>
          <div style={{ height: 12, width: 70, borderRadius: 9, background: '#6FD3E6' }}/>
          <div style={{ height: 12, width: 53, borderRadius: 9, background: 'rgba(111,211,230,.7)' }}/>
          <div style={{ height: 12, width: 35, borderRadius: 9, background: 'rgba(111,211,230,.4)' }}/>
        </div>
        <div style={{ fontSize: 66, fontWeight: 800, letterSpacing: -5 }}>firn</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ fontSize: 64, fontWeight: 600, letterSpacing: -2 }}>A clearer view of investing.</div>
        <div style={{ fontSize: 26, color: '#8AA2AF' }}>Explore investment plans, track growth, understand the details.</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        <div style={{ color: '#8AA2AF', fontSize: 20 }}>Targets are not guarantees. Capital can be lost.</div>
      </div>
    </div>,
    size,
  );
}
