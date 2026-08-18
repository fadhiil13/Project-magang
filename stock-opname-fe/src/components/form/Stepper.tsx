'use client';

import { Check } from 'lucide-react';

interface StepperProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
}

const steps = [
  { label: 'Data Umum' },
  { label: 'Analisa & Data Aset' },
  { label: 'Tanda Tangan' },
];

export default function Stepper({ currentStep, onStepClick }: StepperProps) {
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, idx) => {
        const stepNum = idx + 1;
        const isCompleted = stepNum < currentStep;
        const isActive = stepNum === currentStep;
        const canClick = stepNum < currentStep && onStepClick;

        return (
          <div key={idx} className="flex items-center">
            {/* Circle */}
            <button
              type="button"
              onClick={() => canClick && onStepClick(stepNum)}
              disabled={!canClick}
              className={`flex items-center gap-2 ${canClick ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  isCompleted
                    ? 'bg-kai-navy text-white'
                    : isActive
                      ? 'bg-kai-orange text-white'
                      : 'bg-kai-gray-200 text-kai-gray-500'
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : stepNum}
              </div>
              <span
                className={`text-sm hidden sm:inline ${
                  isActive ? 'font-semibold text-kai-black' : 'text-kai-gray-500'
                }`}
              >
                {step.label}
              </span>
            </button>

            {/* Line */}
            {idx < steps.length - 1 && (
              <div
                className={`w-12 sm:w-20 h-0.5 mx-2 ${
                  stepNum < currentStep ? 'bg-kai-navy' : 'bg-kai-gray-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}