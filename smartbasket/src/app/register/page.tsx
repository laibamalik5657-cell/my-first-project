"use client";

import React, { useState } from "react";
import RegisterForm from "../../components/RegisterForm";
import Welcome from "../../components/Welcome";

function Register() {
  const [step, setStep] = useState(1);

  return (
    <div>
      {step === 1 ? (
        <Welcome nextStep={setStep} />
      ) : (
        <RegisterForm previousStep={setStep} />
      )}
    </div>
  );
}

export default Register;