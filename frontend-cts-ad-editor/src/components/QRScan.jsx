import React from 'react';
import InteractiveElement from './InteractiveElement';

const QRScan = ({ initialProps, onChange, qrUrl }) => {
  return (
    <InteractiveElement initialProps={initialProps} onChange={onChange}>
      <img src={qrUrl} alt="QR Code" style={{ width: '100%', height: '100%' }} />
    </InteractiveElement>
  );
};

export default QRScan; 