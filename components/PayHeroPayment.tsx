"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { X, Smartphone, Shield, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface PayHeroPaymentProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  onSuccess: () => void;
  // Add course_payment for purchasing courses
  type: 'deposit' | 'withdrawal' | 'course_payment';
  description: string;
  // Optional courseId when type is course_payment
  courseId?: string;
}

interface PaymentFormData {
  phoneNumber: string;
}

export function PayHeroPayment({
  isOpen,
  onClose,
  amount,
  onSuccess,
  type,
  description,
  courseId
}: PayHeroPaymentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'processing' | 'success' | 'failed'>('form');
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const { register, handleSubmit, formState: { errors }, watch } = useForm<PaymentFormData>();

  const phoneNumber = watch("phoneNumber");

  const onSubmit = async (data: PaymentFormData) => {
    try {
      setIsLoading(true);
      setStep('processing');
      
      // Determine the correct endpoint
      let endpoint = `/api/wallet/${type}`;
      if (type === 'course_payment') {
        // Dedicated course payment route
        endpoint = '/api/wallet/course-payment';
      }

      // Convert 07 format to 254 format for backend
      let phoneNumber = data.phoneNumber.replace(/\D/g, ''); // Remove non-digits
      if (phoneNumber.startsWith('0')) {
        phoneNumber = '254' + phoneNumber.substring(1);
      }

      console.log('Original phone number:', data.phoneNumber);
      console.log('Converted phone number:', phoneNumber);
      console.log('Phone number length:', phoneNumber.length);

      // Validate converted phone number
      if (!phoneNumber || phoneNumber.length !== 12 || !phoneNumber.startsWith('254')) {
        throw new Error('Invalid phone number format');
      }

      console.log('Submitting PayHero payment:', {
        amount,
        type,
        phoneNumber,
        description,
        courseId
      });

      const body: Record<string, any> = {
        amount,
        phoneNumber,
        description
      };
      if (type === 'course_payment') {
        body.paymentMethod = 'MPESA'; // Align with backend expectation
        if (courseId) body.courseId = courseId;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();
      
      if (!response.ok) {
        // Handle specific PayHero errors
        if (result.error?.includes('PayHero account inactive') || result.accountStatus === 'inactive') {
          throw new Error('Payment service temporarily unavailable. Please contact support.');
        }
        throw new Error(result.error || 'Payment failed');
      }

    if (type === 'deposit' || type === 'course_payment') {
        // Store transaction ID and start polling for deposits
        setTransactionId(result.transactionId || result.checkoutRequestId);
        if (result.checkoutRequestId) {
          startPolling(result.checkoutRequestId);
          toast.success('Please check your phone to complete the payment');
        } else {
          setStep('success');
      toast.success(type === 'course_payment' ? 'Course payment submitted successfully!' : 'Deposit request submitted successfully!');
          setTimeout(() => {
            onSuccess();
            onClose();
            resetForm();
          }, 3000);
        }
      } else {
        // Withdrawal is processed manually
        setStep('success');
        toast.success('Withdrawal request submitted successfully!');
        setTimeout(() => {
          onSuccess();
          onClose();
          resetForm();
        }, 3000);
      }
      
    } catch (error: any) {
      console.error('PayHero payment error:', error);
      setStep('failed');
      toast.error(error.message || 'Failed to initiate payment');
    } finally {
      setIsLoading(false);
    }
  };

  const startPolling = (checkoutId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/wallet/payment-status?checkoutRequestId=${checkoutId}`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const transaction = await response.json();
          
          if (transaction.status === 'COMPLETED') {
            clearInterval(interval);
            setPollingInterval(null);
            setStep('success');
            toast.success('Payment completed successfully!');
            
            // Auto close after 3 seconds
            setTimeout(() => {
              onSuccess();
              onClose();
              resetForm();
            }, 3000);
          } else if (transaction.status === 'FAILED') {
            clearInterval(interval);
            setPollingInterval(null);
            setStep('failed');
            toast.error('Payment failed. Please try again.');
          }
        }
      } catch (error) {
        console.error('Error polling transaction status:', error);
      }
    }, 3000); // Poll every 3 seconds
    
    setPollingInterval(interval);
    
    // Stop polling after 5 minutes (100 attempts)
    setTimeout(() => {
      if (interval) {
        clearInterval(interval);
        setPollingInterval(null);
        setStep('failed');
        toast.error('Payment timeout. Please check your phone and try again.');
      }
    }, 300000);
  };

  const resetForm = () => {
    setStep('form');
    setTransactionId(null);
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as 0XXX XXX XXX for display
    if (digits.startsWith('0') && digits.length <= 10) {
      const formatted = digits.replace(/^0(\d{3})(\d{3})(\d{3})$/, '0$1 $2 $3');
      return formatted.length <= 12 ? formatted : value;
    }
    
    return digits.length <= 10 ? digits : value;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl transform transition-all">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 rounded-t-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{type === 'course_payment' ? 'Course Payment' : 'Make Payment'}</h2>
                <p className="text-green-100 text-sm">Secure & Fast</p>
              </div>
            </div>
            <button
              onClick={() => {
                if (pollingInterval) {
                  clearInterval(pollingInterval);
                  setPollingInterval(null);
                }
                onClose();
                resetForm();
              }}
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
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl mb-6 border border-green-100">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">{description}</p>
                  <p className="text-3xl font-bold text-green-600">
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
                      className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                        errors.phoneNumber ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      placeholder="0712345678"
                      {...register("phoneNumber", {
                        required: "Phone number is required",
                        pattern: {
                          value: /^0\d{3}\s?\d{3}\s?\d{3}$/,
                          message: "Enter a valid phone number starting with 0"
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
                        {type === 'deposit' 
                          ? "Your payment is protected by PayHero security protocols. You'll receive an SMS prompt to complete the transaction."
                          : "Your withdrawal request will be processed securely within 24 hours during business hours."
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-4 px-6 rounded-xl transition-all transform hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-green-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Processing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <Smartphone className="w-5 h-5" />
                        <span>{type === 'deposit' || type === 'course_payment' ? 'Pay with Mpesa' : 'Request Withdrawal'}</span>
                      </div>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      if (pollingInterval) {
                        clearInterval(pollingInterval);
                        setPollingInterval(null);
                      }
                      onClose();
                      resetForm();
                    }}
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
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Waiting for Payment</h3>
              <p className="text-gray-600 mb-4">
                Please check your phone and complete the M-Pesa payment...
              </p>
              <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  Enter your M-Pesa PIN when prompted. We'll automatically detect when the payment is completed.
                </p>
              </div>
              {transactionId && (
                <div className="mt-4 text-xs text-gray-500">
                  Transaction ID: {transactionId}
                </div>
              )}
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {type === 'deposit' ? 'Payment Completed!' : 'Withdrawal Submitted!'}
              </h3>
              <p className="text-gray-600 mb-4">
                {type === 'deposit' 
                  ? 'Your payment has been processed successfully.'
                  : 'Your withdrawal request has been submitted successfully.'
                }
              </p>
              <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                <p className="text-sm text-green-800">
                  {type === 'deposit' 
                    ? 'Your wallet has been updated with the payment amount.'
                    : 'Your withdrawal will be processed within 24 hours during business hours.'
                  }
                </p>
              </div>
            </div>
          )}

          {step === 'failed' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Payment Failed</h3>
              <p className="text-gray-600 mb-4">
                The payment could not be completed.
              </p>
              <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                <p className="text-sm text-red-800">
                  Please check your phone and try again. If the problem persists, contact support.
                </p>
              </div>
              <button
                onClick={() => {
                  resetForm();
                  setStep('form');
                }}
                className="mt-4 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
