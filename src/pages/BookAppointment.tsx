import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Calendar, 
  Clock, 
  User as UserIcon, 
  Search, 
  ChevronRight, 
  Star, 
  Info,
  CheckCircle2,
  Loader2,
  Video,
  MapPin,
  MessageSquare
} from 'lucide-react';
import { cn, handleFirestoreError, OperationType } from '../lib/utils';
import { collection, query, where, getDocs, addDoc, serverTimestamp, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNavigate, useLocation } from 'react-router-dom';

export const BookAppointment: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isReschedule = location.state?.isReschedule || false;
  const oldConsultationId = location.state?.oldConsultationId;
  const rescheduleCount = location.state?.rescheduleCount || 0;
  const isFreeReschedule = isReschedule && rescheduleCount < 3;
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [appointmentType, setAppointmentType] = useState<'appointment' | 'consultation'>('appointment');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const timeSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
  ];

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'doctor'));
        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDoctors(docs);
      } catch (error) {
        console.error('Error fetching doctors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  // Fetch booked slots when doctor or date changes
  useEffect(() => {
    // Reset the slots so they don't bleed between doctors while loading/failing
    setBookedSlots([]);

    if (!selectedDoctor || !selectedDate) {
      return;
    }

    let apts: string[] = [];
    let cons: string[] = [];

    const updateSlots = () => {
      const booked = [...apts, ...cons];
      setBookedSlots(booked);
      
      // Reset selected time if it's now booked
      if (selectedTime && booked.includes(selectedTime)) {
        setSelectedTime(null);
      }
    };

    const qApt = query(collection(db, 'appointments'), where('doctorId', '==', selectedDoctor.id), where('date', '==', selectedDate));
    const unsubApt = onSnapshot(qApt, (snapshot) => { apts = snapshot.docs.map(doc => doc.data().time); updateSlots(); });

    const qCons = query(collection(db, 'consultations'), where('doctorId', '==', selectedDoctor.id), where('date', '==', selectedDate));
    const unsubCons = onSnapshot(qCons, (snapshot) => { cons = snapshot.docs.map(doc => doc.data().time); updateSlots(); });

    return () => { unsubApt(); unsubCons(); };
  }, [selectedDoctor, selectedDate]);

  const handleProceed = () => {
    if (selectedDoctor && selectedDate && selectedTime) {
      setShowConfirmation(true);
    }
  };

  const handleBooking = async () => {
    if (!auth.currentUser || !selectedDoctor || !selectedDate || !selectedTime) return;

    setBooking(true);
    try {
      const doctorName = `${selectedDoctor.firstName} ${selectedDoctor.lastName}`;
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const patientName = userDoc.exists() && userDoc.data().firstName ? `${userDoc.data().firstName} ${userDoc.data().lastName}` : (auth.currentUser.displayName || 'Patient');

      if (appointmentType === 'appointment') {
         await addDoc(collection(db, 'appointments'), {
           patientId: auth.currentUser.uid,
           patientName: patientName,
           doctorId: selectedDoctor.id,
           doctorName: doctorName,
           date: selectedDate,
           time: selectedTime,
           status: 'Scheduled',
           type: 'In-person',
           priority: 'Medium',
           amount: Number(selectedDoctor.consultationFee || 500),
           createdAt: new Date().toISOString()
         }).catch(error => handleFirestoreError(error, OperationType.WRITE, 'appointments'));
      } else {
         await addDoc(collection(db, 'consultations'), {
           patientId: auth.currentUser.uid,
           patientName: patientName,
           doctorId: selectedDoctor.id,
           doctorName: doctorName,
           date: selectedDate,
           time: selectedTime,
           status: 'Scheduled',
           specialty: selectedDoctor.specialty || 'General Physician',
           rescheduleCount: isReschedule ? rescheduleCount + 1 : 0,
           amount: Number(selectedDoctor.consultationFee || 500),
           createdAt: new Date().toISOString()
         }).catch(error => handleFirestoreError(error, OperationType.WRITE, 'consultations'));

         if (isReschedule && oldConsultationId) {
           await updateDoc(doc(db, 'consultations', oldConsultationId), {
             status: 'Rescheduled'
           }).catch(error => handleFirestoreError(error, OperationType.UPDATE, 'consultations'));
         }
      }

      navigate('/patient');
    } catch (error: any) {
      console.error('Error booking appointment:', error);
      alert(`Failed to book appointment. System Error: ${error.message || JSON.stringify(error)}`);
    } finally {
      setBooking(false);
    }
  };

  const filteredDoctors = doctors.filter(doc => 
    `${doc.firstName} ${doc.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.specialty?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-display font-extrabold text-slate-900 mb-2">Book an Appointment</h1>
        <p className="text-slate-500 text-lg">Choose your preferred doctor and schedule a consultation.</p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-10">
        {/* Step 1: Select Doctor */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white rounded-4xl border border-slate-100 shadow-sm p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-display font-bold text-slate-900 flex items-center gap-3">
                <span className="w-8 h-8 bg-brand-600 text-white rounded-xl flex items-center justify-center text-sm">1</span>
                Select a Specialist
              </h2>
              <div className="relative group w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search by name or specialty..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs focus:ring-2 focus:ring-brand-500/20 transition-all outline-none"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {loading ? (
                <div className="col-span-full py-10 text-center text-slate-400">Loading specialists...</div>
              ) : filteredDoctors.length > 0 ? filteredDoctors.map((doc) => (
                <div 
                  key={doc.id}
                  onClick={() => setSelectedDoctor(doc)}
                  className={cn(
                    "p-6 rounded-3xl border-2 transition-all cursor-pointer group",
                    selectedDoctor?.id === doc.id 
                      ? "border-brand-600 bg-brand-50/30 shadow-lg shadow-brand-500/5" 
                      : "border-slate-50 bg-white hover:border-slate-200"
                  )}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                      <UserIcon className="w-8 h-8 text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 truncate">{doc.firstName} {doc.lastName}</h4>
                      <p className="text-xs text-slate-500 mb-2">{doc.specialty || 'General Physician'}</p>
                      <div className="flex items-center gap-3 mt-2">
                        {doc.experience && (
                          <div className="flex items-center gap-1 text-slate-500 px-2 py-0.5 rounded-md border border-slate-100">
                            <Clock className="w-3 h-3" />
                            <span className="text-[10px] font-black uppercase tracking-wider">{doc.experience}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-slate-500 px-2 py-0.5 rounded-md border border-slate-100">
                          <Info className="w-3 h-3" />
                          <span className="text-[10px] font-black uppercase tracking-wider">₹{doc.consultationFee || '500'} Fee</span>
                        </div>
                      </div>
                      {doc.location && (
                        <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                          <MapPin className="w-3 h-3 shrink-0" /> <span className="truncate">{doc.location}</span>
                        </p>
                      )}
                      {doc.bio && (
                        <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed italic border-l-2 border-slate-200 pl-2">"{doc.bio}"</p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2 py-1 rounded-md">
                      Available Today
                    </span>
                    <ChevronRight className={cn(
                      "w-4 h-4 transition-transform",
                      selectedDoctor?.id === doc.id ? "text-brand-600 translate-x-1" : "text-slate-300"
                    )} />
                  </div>
                </div>
              )) : (
                <div className="col-span-full py-10 text-center text-slate-400">No specialists found.</div>
              )}
            </div>
          </section>

          {/* Step 2: Select Date & Time */}
          <section className={cn(
            "bg-white rounded-4xl border border-slate-100 shadow-sm p-8 transition-all duration-500",
            !selectedDoctor && "opacity-50 pointer-events-none grayscale"
          )}>
            <h2 className="text-xl font-display font-bold text-slate-900 flex items-center gap-3 mb-8">
              <span className="w-8 h-8 bg-brand-600 text-white rounded-xl flex items-center justify-center text-sm">2</span>
              Schedule Date & Time
            </h2>

            {/* Booking Type Toggle */}
            <div className="flex gap-4 mb-8">
              <button 
                onClick={() => setAppointmentType('appointment')}
                className={cn("flex-1 py-4 rounded-2xl font-bold flex flex-col items-center justify-center gap-2 transition-all border-2", appointmentType === 'appointment' ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-slate-100 bg-white text-slate-500 hover:border-slate-200")}
              >
                <UserIcon className="w-5 h-5" /> Clinic Visit
              </button>
              <button 
                onClick={() => setAppointmentType('consultation')}
                className={cn("flex-1 py-4 rounded-2xl font-bold flex flex-col items-center justify-center gap-2 transition-all border-2", appointmentType === 'consultation' ? "border-brand-600 bg-brand-50 text-brand-700" : "border-slate-100 bg-white text-slate-500 hover:border-slate-200")}
              >
                <MessageSquare className="w-5 h-5" /> Chat Consultation
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-10">
              {/* Simple Calendar Placeholder */}
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h4 className="font-bold text-slate-900">March 2026</h4>
                  <div className="flex gap-2">
                    <button className="p-2 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all text-slate-400"><ChevronRight className="w-4 h-4 rotate-180" /></button>
                    <button className="p-2 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all text-slate-400"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-2 text-center mb-4">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span key={`${d}-${i}`} className="text-[10px] font-black text-slate-400 uppercase">{d}</span>)}
                </div>
                <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 31 }).map((_, i) => {
                      const day = i + 1;
                      const dateStr = `2026-03-${day.toString().padStart(2, '0')}`;
                      const isSelected = selectedDate === dateStr;
                      
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      // Compare dates by adding timezone offset to ensure safe boundary comparisons
                      const isPast = new Date(dateStr + "T00:00:00") < today;

                      return (
                        <button 
                          key={i} 
                          onClick={() => setSelectedDate(dateStr)}
                          disabled={isPast}
                          className={cn(
                            "aspect-square rounded-xl text-sm font-bold transition-all",
                            isPast ? "text-slate-300 cursor-not-allowed bg-slate-50/50 opacity-50" : 
                            isSelected ? "bg-brand-600 text-white shadow-lg shadow-brand-500/20" : "hover:bg-slate-50 text-slate-600"
                          )}
                        >
                          {day}
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Time Slots */}
              <div>
                <h4 className="font-bold text-slate-900 mb-6">Available Slots</h4>
                <div className="grid grid-cols-3 gap-3">
                  {timeSlots.map((slot) => {
                    const isBooked = bookedSlots.includes(slot);
                    
                    // Determine if the slot has passed
                    let isPastSlot = false;
                    if (selectedDate) {
                      const [timeVal, modifier] = slot.split(' ');
                      let [hoursStr, minutesStr] = timeVal.split(':');
                      let hours = parseInt(hoursStr, 10);
                      
                      if (hours === 12 && modifier === 'AM') hours = 0;
                      else if (hours < 12 && modifier === 'PM') hours += 12;
                      
                      const slotDateTime = new Date(`${selectedDate}T${hours.toString().padStart(2, '0')}:${minutesStr}:00`);
                      isPastSlot = slotDateTime < new Date();
                    }
                    
                    const isDisabled = isBooked || isPastSlot;

                    return (
                      <button
                        key={slot}
                        disabled={isDisabled}
                        onClick={() => setSelectedTime(slot)}
                        className={cn(
                          "py-3 rounded-2xl text-xs font-bold transition-all border-2",
                          selectedTime === slot 
                            ? "bg-brand-600 text-white border-brand-600 shadow-lg shadow-brand-500/20" 
                            : isBooked
                              ? "bg-slate-50 text-slate-300 border-slate-50 cursor-not-allowed"
                              : isPastSlot
                                ? "bg-slate-50 text-slate-300 border-slate-50 cursor-not-allowed opacity-50"
                                : "bg-white text-slate-600 border-slate-50 hover:border-slate-200"
                        )}
                      >
                        {slot}
                        {isBooked && <span className="block text-[8px] mt-1 text-slate-400">Booked</span>}
                        {isPastSlot && !isBooked && <span className="block text-[8px] mt-1 text-slate-400">Passed</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Step 3: Summary & Confirmation */}
        <div className="space-y-6 sticky top-32">
          <section className="bg-white rounded-4xl border border-slate-100 shadow-sm p-8">
            <h2 className="text-xl font-display font-bold text-slate-900 mb-8">Booking Summary</h2>
            
            <div className="space-y-6 mb-10">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl">
                <div className="w-12 h-12 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-600">
                  <UserIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Doctor</p>
                  <p className="font-bold text-slate-900">{selectedDoctor ? `${selectedDoctor.firstName} ${selectedDoctor.lastName}` : 'Not selected'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Date</p>
                  <p className="font-bold text-slate-900">
                    {selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not selected'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Time Slot</p>
                  <p className="font-bold text-slate-900">{selectedTime || 'Not selected'}</p>
                </div>
              </div>
            </div>

              <div className="p-6 bg-brand-50 rounded-3xl border border-brand-100 mb-8">
                <div className="flex items-center gap-3 mb-3 text-brand-600">
                  <Info className="w-5 h-5" />
                  <h4 className="font-bold text-sm">{isReschedule ? 'Reschedule Fee' : 'Consultation Fee'}</h4>
                </div>
                <div className="flex justify-between items-end">
                  <p className="text-xs text-brand-700 font-medium">
                    {isFreeReschedule ? `Free Reschedule (${rescheduleCount}/3 used)` : 'Standard Specialist Fee'}
                  </p>
                  <p className="text-2xl font-display font-black text-brand-700">₹{isFreeReschedule ? '0.00' : (selectedDoctor?.consultationFee || 500)}</p>
                </div>
              </div>

            <button 
              onClick={handleProceed}
              disabled={!selectedDoctor || !selectedDate || !selectedTime || booking}
              className={cn(
                "w-full py-5 rounded-3xl font-bold text-lg transition-all flex items-center justify-center gap-2",
                selectedDoctor && selectedDate && selectedTime && !booking
                  ? "bg-brand-600 text-white shadow-xl shadow-brand-500/20 hover:bg-brand-700 hover:-translate-y-1"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              )}
            >
              {isReschedule ? 'Proceed to Confirm Reschedule' : 'Proceed to Confirm Booking'}
              <ChevronRight className="w-5 h-5" />
            </button>
          </section>

          <div className="p-6 bg-slate-900 rounded-4xl text-white relative overflow-hidden">
            <div className="relative z-10">
              <h4 className="font-bold mb-2">Need Help?</h4>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">Our support team is available 24/7 for any booking assistance.</p>
              <button className="text-xs font-bold text-brand-400 hover:underline">Chat with Support</button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl"
          >
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-2xl font-display font-bold text-slate-900">{isReschedule ? 'Confirm Reschedule' : 'Confirm Appointment'}</h3>
              <button 
                onClick={() => setShowConfirmation(false)}
                className="p-2 hover:bg-slate-50 rounded-xl transition-colors"
              >
                <Info className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="flex items-start gap-4 p-5 bg-slate-50 rounded-3xl">
                <div className="w-12 h-12 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-600 shrink-0">
                  <UserIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Doctor</p>
                  <p className="font-bold text-slate-900 text-lg">{selectedDoctor?.firstName} {selectedDoctor?.lastName}</p>
                  <p className="text-xs text-slate-500">{selectedDoctor?.specialty || 'General Physician'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-slate-50 rounded-3xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Date</p>
                  <p className="font-bold text-slate-900">
                    {selectedDate && new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div className="p-5 bg-slate-50 rounded-3xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Time</p>
                  <p className="font-bold text-slate-900">{selectedTime}</p>
                </div>
              </div>

              <div className="p-6 bg-brand-50 rounded-3xl border border-brand-100">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-brand-700 font-medium">{isReschedule ? 'Reschedule Fee' : 'Consultation Fee'}</p>
                    <p className="text-[10px] text-brand-500">{isFreeReschedule ? 'Free of charge' : 'Payable at clinic'}</p>
                  </div>
                  <p className="text-3xl font-display font-black text-brand-700">₹{isFreeReschedule ? '0.00' : (selectedDoctor?.consultationFee || 500)}</p>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1 py-4 rounded-2xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
                >
                  Go Back
                </button>
                <button 
                  onClick={handleBooking}
                  disabled={booking}
                  className="flex-[2] py-4 rounded-2xl font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2"
                >
                  {booking ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    <>
                      Confirm Booking
                      <CheckCircle2 className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default BookAppointment;
