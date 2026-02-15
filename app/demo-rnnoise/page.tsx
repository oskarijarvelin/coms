'use client';

import { useState } from 'react';
import { icons, iconSizes } from '@/config/icons';

/**
 * Demo page to showcase RNNoise settings UI
 */
export default function RNNoiseDemoPage() {
  const [echoCancellation, setEchoCancellation] = useState(true);
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [autoGainControl, setAutoGainControl] = useState(true);
  const [rnnoiseEnabled, setRnnoiseEnabled] = useState(false);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl border border-gray-700 p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Ääniasetukset</h3>
        </div>

        <div className="space-y-6">
          {/* Audio Processing Section */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-2 flex items-center gap-2">
                <icons.audioProcessing className={iconSizes.md} />
                Äänen käsittely
              </h4>
              <p className="text-xs text-gray-400 mb-3">Nämä asetukset vaativat uudelleenyhdistämisen toimiakseen</p>
            </div>

            <label className="flex items-center justify-between cursor-pointer group p-2 rounded hover:bg-gray-700/50 transition-colors">
              <div className="flex-1">
                <span className="text-sm text-gray-200 group-hover:text-white transition-colors block">
                  Kaiun poisto
                </span>
                <span className="text-xs text-gray-400">
                  Poistaa kaiun ja takaisinkytkennän
                </span>
              </div>
              <input
                type="checkbox"
                checked={echoCancellation}
                onChange={(e) => setEchoCancellation(e.target.checked)}
                className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer group p-2 rounded hover:bg-gray-700/50 transition-colors">
              <div className="flex-1">
                <span className="text-sm text-gray-200 group-hover:text-white transition-colors block">
                  Kohinan vaimennus
                </span>
                <span className="text-xs text-gray-400">
                  Vähentää taustamelua
                </span>
              </div>
              <input
                type="checkbox"
                checked={noiseSuppression}
                onChange={(e) => setNoiseSuppression(e.target.checked)}
                className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer group p-2 rounded hover:bg-gray-700/50 transition-colors">
              <div className="flex-1">
                <span className="text-sm text-gray-200 group-hover:text-white transition-colors block">
                  Automaattinen vahvistuksen säätö
                </span>
                <span className="text-xs text-gray-400">
                  Normalisoi äänenvoimakkuuden
                </span>
              </div>
              <input
                type="checkbox"
                checked={autoGainControl}
                onChange={(e) => setAutoGainControl(e.target.checked)}
                className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
              />
            </label>

            {/* Divider */}
            <div className="border-t border-gray-700 my-2"></div>

            <label className="flex items-center justify-between cursor-pointer group p-2 rounded hover:bg-gray-700/50 transition-colors">
              <div className="flex-1">
                <span className="text-sm text-gray-200 group-hover:text-white transition-colors block font-medium">
                  RNNoise melunpoisto
                </span>
                <span className="text-xs text-gray-400">
                  Edistynyt melunpoisto (korvaa kohinan vaimennuksen)
                </span>
              </div>
              <input
                type="checkbox"
                checked={rnnoiseEnabled}
                onChange={(e) => {
                  setRnnoiseEnabled(e.target.checked);
                  // When RNNoise is enabled, disable browser noise suppression
                  if (e.target.checked) {
                    setNoiseSuppression(false);
                  }
                }}
                className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-green-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-0 cursor-pointer"
              />
            </label>

            {/* Info message when RNNoise is enabled */}
            {rnnoiseEnabled && (
              <div className="bg-green-900/20 border border-green-700/50 rounded p-3">
                <p className="text-xs text-green-300 flex items-start gap-2">
                  <icons.info className={iconSizes.sm + ' shrink-0 mt-0.5'} />
                  <span>
                    <strong>RNNoise käytössä:</strong> Edistynyt melunpoisto on aktiivinen. Selaimien natiivimelunpoisto on automaattisesti pois päältä.
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
