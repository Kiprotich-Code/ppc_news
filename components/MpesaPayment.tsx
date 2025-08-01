"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { X, Smartphone, Shield, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface MpesaPaymentProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  onSuccess: () => void;
  type: 'deposit' | 'withdrawal' | 'course_payment';
  description: string;
}

interface PaymentFormData {
  phoneNumber: string;
}

export function MpesaPayment({
  isOpen,
  onClose,
  amount,
  onSuccess,
  type,
  description
}: MpesaPaymentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');
  const { register, handleSubmit, formState: { errors }, watch } = useForm<PaymentFormData>();

  const phoneNumber = watch("phoneNumber");

  const onSubmit = async (data: PaymentFormData) => {
    try {
      setIsLoading(true);
      setStep('processing');
      
      let endpoint = '/api/wallet';
      if (type === 'course_payment') {
        endpoint = '/api/wallet/course-payment';
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include', // Add this line
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount,
          paymentMethod: 'MPESA',
          phoneNumber: data.phoneNumber,
          description
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Payment failed');
      }

      setStep('success');
      toast.success('Please check your phone to complete the payment');
      
      // Auto close and trigger success after 3 seconds
      setTimeout(() => {
        onSuccess();
        onClose();
        setStep('form'); // Reset for next time
      }, 3000);
      
    } catch (error: any) {
      setStep('form');
      toast.error(error.message || 'Failed to initiate payment');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as +254 XXX XXX XXX
    if (digits.startsWith('254')) {
      const formatted = digits.replace(/^254(\d{3})(\d{3})(\d{3})$/, '+254 $1 $2 $3');
      return formatted.length <= 13 ? formatted : value;
    }
    
    return digits.length <= 12 ? digits : value;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl transform transition-all">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 rounded-t-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">M-Pesa Payment</h2>
                <p className="text-red-100 text-sm">Secure & Instant</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'form' && (
            <>
              {/* Amount Display */}
              <div className="bg-gradient-to-r from-red-50 to-orange-50 p-4 rounded-xl mb-6 border border-red-100">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">{description}</p>
                  <p className="text-3xl font-bold text-red-600">
                    KSh {amount.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    M-Pesa Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Smartphone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all ${
                        errors.phoneNumber ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      placeholder="254712345678"
                      {...register("phoneNumber", {
                        required: "Phone number is required",
                        pattern: {
                          value: /^254[0-9]{9}$/,
                          message: "Enter a valid phone number starting with 254"
                        }
                      })}
                      onChange={(e) => {
                        const formatted = formatPhoneNumber(e.target.value);
                        e.target.value = formatted;
                      }}
                    />
                  </div>
                  {errors.phoneNumber && (
                    <div className="flex items-center space-x-2 text-red-600">
                      <AlertCircle className="w-4 h-4" />
                      <p className="text-sm">{errors.phoneNumber.message}</p>
                    </div>
                  )}
                </div>

                {/* Security Notice */}
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Secure Payment</p>
                      <p className="text-xs text-blue-600 mt-1">
                        Your payment is protected by M-Pesa security protocols. You'll receive an SMS prompt to complete the transaction.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-4 px-6 rounded-xl transition-all transform hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-red-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Processing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <Smartphone className="w-5 h-5" />
                        <span>Pay with M-Pesa</span>
                      </div>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-medium py-3 px-6 rounded-xl transition-all hover:bg-gray-50"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </>
          )}

          {step === 'processing' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Processing Payment</h3>
              <p className="text-gray-600 mb-4">
                We're sending a payment request to your phone...
              </p>
              <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  Please check your phone for the M-Pesa payment prompt and enter your PIN to complete the transaction.
                </p>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Payment Initiated!</h3>
              <p className="text-gray-600 mb-4">
                Check your phone to complete the M-Pesa payment.
              </p>
              <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                <p className="text-sm text-green-800">
                  You should receive an SMS shortly. Enter your M-Pesa PIN to confirm the payment.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}