type StepperProps = {
  step: 1 | 2 | 3
}

const steps = ['Paste answer', 'Checking', 'Report'] as const

export function Stepper({ step }: StepperProps) {
  return (
    <nav className="stepper" aria-label="Verification steps">
      <ol className="stepper__list">
        {steps.map((label, index) => {
          const number = index + 1
          const state =
            number === step
              ? 'current'
              : number < step
                ? 'complete'
                : 'upcoming'

          return (
            <li
              key={label}
              className={`stepper__item stepper__item--${state}`}
              aria-current={state === 'current' ? 'step' : undefined}
            >
              <span className="stepper__number">{number}</span>
              <span className="stepper__label">{label}</span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
