import React from 'react';
import MobileCallCard from './MobileCallCard';
import SwipeableCard from './SwipeableCard';

const SwipeableMobileCallCard = ({
  customer,
  onCallCustomer,
  onLogCall,
  onViewProfile,
  onViewHistory,
  onDeleteCustomer,
  className = ''
}) => {
  // Handle swipe left (call action) - updated to match new requirement
  const handleSwipeLeft = () => {
    console.log('📞 Swipe left - Call Now for:', customer.name);
    const phoneNumbers = [];
    if (customer.mobile1) phoneNumbers.push(customer.mobile1);
    if (customer.mobile2) phoneNumbers.push(customer.mobile2);
    if (customer.mobile3) phoneNumbers.push(customer.mobile3);
    
    if (phoneNumbers.length > 0) {
      onCallCustomer(customer); // Use primary number by default
    }
  };

  // Handle swipe right (log action)
  const handleSwipeRight = () => {
    console.log('📝 Swipe right - Log Call for:', customer.name);
    onLogCall(customer);
  };

  // Action handlers for the mobile card
  const handleCallCustomer = (customerWithNumber) => {
    console.log('📞 Call initiated for:', customerWithNumber.name, 'on number:', customerWithNumber.mobile1);
    onCallCustomer(customerWithNumber);
  };

  const handleLogCall = (customer) => {
    console.log('📝 Log call initiated for:', customer.name);
    onLogCall(customer);
  };

  const handleViewProfile = (customer) => {
    console.log('👤 View profile for:', customer.name);
    onViewProfile(customer);
  };

  const handleViewHistory = (customer) => {
    console.log('📋 View history for:', customer.name);
    onViewHistory(customer);
  };

  const handleDeleteCustomer = (customerId) => {
    console.log('🗑️ Delete customer with ID:', customerId);
    onDeleteCustomer(customerId);
  };

  return (
    <SwipeableCard
      onSwipeLeft={handleSwipeLeft}
      onSwipeRight={handleSwipeRight}
      leftAction={{
        icon: () => null, // Icon handled by MobileCallCard
        label: 'Log Call',
        color: 'from-emerald-500 to-emerald-600'
      }}
      rightAction={{
        icon: () => null, // Icon handled by MobileCallCard
        label: 'Call Now',
        color: 'from-blue-500 to-blue-600'
      }}
      threshold={80}
      maxSwipe={120}
      angleThreshold={25}
      className={className}
    >
      <MobileCallCard
        customer={customer}
        onCallCustomer={handleCallCustomer}
        onLogCall={handleLogCall}
        onViewProfile={handleViewProfile}
        onViewHistory={handleViewHistory}
        onDeleteCustomer={handleDeleteCustomer}
      />
    </SwipeableCard>
  );
};

export default SwipeableMobileCallCard;