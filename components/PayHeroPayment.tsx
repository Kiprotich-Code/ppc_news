"use client";
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { X, Smartphone, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';

interface PayHeroPaymentProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  onSuccess: () => void;
  type: 'deposit' | 'withdrawal';
  description: string;
}

type PaymentStatus = 'form' | 'processing' | 'waiting' | 'success' | 'failed';

export const PayHeroPayment: React.FC<PayHeroPaymentProps> = ({
  isOpen,
  onClose,
  amount,
  onSuccess,
  type,
  description
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<PaymentStatus>('form');
  const [checkoutRequestId, setCheckoutRequestId] = useState<string>('');
  const [countdown, setCountdown] = useState(120); // 2 minutes timeout
  const { data: session } = useSession();

  // Countdown timer for payment timeout
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'waiting' && countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setStatus('failed');
            toast.error('Payment timeout. Please try again.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status, countdown]);

  // Poll payment status
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    if (status === 'waiting' && checkoutRequestId) {
      pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`/api/wallet/payment-status?checkoutRequestId=${checkoutRequestId}`);
          const result = await response.json();
          
          if (result.status === 'COMPLETED') {
            setStatus('success');
            toast.success('Payment completed successfully!');
            onSuccess();
            setTimeout(() => onClose(), 2000); // Close after showing success
          } else if (result.status === 'FAILED' || result.status === 'CANCELLED') {
            setStatus('failed');
            toast.error('Payment failed or was cancelled');
          }
        } catch (error) {
          console.error('Error polling payment status:', error);
        }
      }, 3000); // Poll every 3 seconds
    }
    return () => clearInterval(pollInterval);
  }, [status, checkoutRequestId, onSuccess, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }
    if (!session?.user?.id) {
      toast.error('Please sign in to proceed');
      return;
    }
    
    setLoading(true);
    setStatus('processing');
    
    try {
      const response = await fetch(`/api/wallet/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: session.user.id,
          amount,
          phoneNumber: phoneNumber.startsWith('254') ? phoneNumber : `254${phoneNumber.slice(-9)}`
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        if (type === 'deposit' && result.checkoutRequestId) {
          // Deposit flow - wait for STK push completion
          setCheckoutRequestId(result.checkoutRequestId);
          setStatus('waiting');
          setCountdown(120);
          toast.success('STK push sent! Check your phone for M-Pesa prompt');
        } else if (type === 'withdrawal' && result.success) {
          // Withdrawal flow - manual processing
          setStatus('success');
          toast.success('Withdrawal request submitted successfully!');
          onSuccess();
          setTimeout(() => onClose(), 3000);
        } else {
          setStatus('failed');
          toast.error(result.error || `${type} failed`);
        }
      } else {
        setStatus('failed');
        toast.error(result.error || `${type} failed`);
      }
    } catch (error) {
      setStatus('failed');
      toast.error(`${type} failed. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (status === 'waiting') {
      const confirm = window.confirm(
        'Payment is still in progress. Are you sure you want to close? You may miss the M-Pesa prompt.'
      );
      if (!confirm) return;
    }
    setStatus('form');
    setCheckoutRequestId('');
    setCountdown(120);
    onClose();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  const renderContent = () => {
    switch (status) {
      case 'form':
      case 'processing':
        return (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                KES {amount.toLocaleString()}
              </h4>
              <p className="text-sm text-gray-600">{description}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                M-Pesa Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="0712345678"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
                disabled={status === 'processing'}
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the phone number registered with M-Pesa
              </p>
            </div>
            <button
              type="submit"
              disabled={loading || !phoneNumber || status === 'processing'}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {status === 'processing' ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Sending STK Push...
                </>
              ) : (
                `${type === 'deposit' ? 'Pay' : 'Withdraw'} KES ${amount.toLocaleString()}`
              )}
            </button>
            <div className="text-center text-xs text-gray-500">
              <p>Powered by PayHero • Secure & Fast</p>
              {type === 'deposit' ? (
                <p className="mt-1">You will receive an M-Pesa prompt on your phone</p>
              ) : (
                <p className="mt-1">Withdrawal will be processed within 24 hours</p>
              )}
            </div>
          </form>
        );

      case 'waiting':
        return (
          <div className="p-6 space-y-6 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
            <h4 className="text-lg font-medium text-gray-900">
              Waiting for Payment
            </h4>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                📱 Check your phone for the M-Pesa payment prompt
              </p>
              <p className="text-sm text-gray-600">
                💰 Amount: <span className="font-semibold">KES {amount.toLocaleString()}</span>
              </p>
              <p className="text-sm text-gray-600">
                📞 Phone: <span className="font-semibold">{phoneNumber}</span>
              </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800 font-medium">
                ⚠️ Do not close this window
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Keep this window open until payment is complete
              </p>
              <p className="text-xs text-yellow-700 mt-2">
                Time remaining: <span className="font-mono font-bold">{formatTime(countdown)}</span>
              </p>
            </div>
            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="p-6 space-y-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h4 className="text-lg font-medium text-green-900">
              {type === 'deposit' ? 'Payment Successful!' : 'Withdrawal Request Submitted!'}
            </h4>
            <p className="text-sm text-gray-600">
              {type === 'deposit' 
                ? `KES ${amount.toLocaleString()} has been added to your wallet`
                : `Your withdrawal request for KES ${amount.toLocaleString()} has been submitted and will be processed within 24 hours.`
              }
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                {type === 'deposit' 
                  ? '✅ Transaction completed successfully'
                  : '✅ Withdrawal request received - You will be notified once processed'
                }
              </p>
            </div>
          </div>
        );

      case 'failed':
        return (
          <div className="p-6 space-y-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h4 className="text-lg font-medium text-red-900">
              Payment Failed
            </h4>
            <p className="text-sm text-gray-600">
              The payment could not be completed. Please try again.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                ❌ Transaction failed or was cancelled
              </p>
            </div>
            <button
              onClick={() => setStatus('form')}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-600 transition-all"
            >
              Try Again
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-semibold text-gray-900">
            {type === 'deposit' ? 'Deposit to Wallet' : 'Withdraw balance'}
          </h3>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={status === 'processing'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {renderContent()}
      </div>
    </div>
  );
};
