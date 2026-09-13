import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet, PanResponder, Animated } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Calendar } from 'lucide-react-native';
import Svg, { G, Circle, Text as SvgText } from 'react-native-svg';
import { useAuth } from '../../src/context/AuthContext';
import { fetchWeekPlan } from '../../src/api/plan';

// Strictly separate the meal renderer from the main Planner tree to prevent CSS Interop layout crashes
const MealList = ({ activeDay }: { activeDay: any }) => {
  if (!activeDay) {
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 80 }}>
        <Calendar size={64} color="#2C2C2E" style={{ marginBottom: 16 }} />
        <Text style={{ color: '#8E8E93', fontSize: 18, fontWeight: '500', textAlign: 'center', paddingHorizontal: 40 }}>
          No protocol generated for this date yet.
        </Text>
      </View>
    );
  }

  // Calculate Macros
  let p = 0;
  let c = 0;
  let f = 0;
  
  if (Array.isArray(activeDay.meals) && activeDay.meals.length > 0) {
    p = activeDay.meals.reduce((sum: number, m: any) => sum + (Number(m.macros?.p) || 0), 0);
    c = activeDay.meals.reduce((sum: number, m: any) => sum + (Number(m.macros?.c) || 0), 0);
    f = activeDay.meals.reduce((sum: number, m: any) => sum + (Number(m.macros?.f) || 0), 0);
  } else {
    p = Number(activeDay.macros_total?.p) || 0;
    c = Number(activeDay.macros_total?.c) || 0;
    f = Number(activeDay.macros_total?.f) || 0;
  }

  const pKcal = p * 4;
  const cKcal = c * 4;
  const fKcal = f * 9;
  const totalKcal = pKcal + cKcal + fKcal;
  
  let pPct = 0, cPct = 0, fPct = 0;
  if (totalKcal > 0) {
    pPct = pKcal / totalKcal;
    cPct = cKcal / totalKcal;
    fPct = fKcal / totalKcal;
  }

  const radius = 50;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  
  const pStroke = pPct * circumference;
  const cStroke = cPct * circumference;
  const fStroke = fPct * circumference;

  const pOffset = 0;
  const cOffset = pStroke;
  const fOffset = pStroke + cStroke;

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
        <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>Scheduled Intake</Text>
        <Text style={{ color: '#8E8E93', textTransform: 'uppercase', fontWeight: 'bold', fontSize: 12, marginTop: 4 }}>
          {String(activeDay.status) === 'blueprint' ? 'BLUEPRINT ONLY' : 'DETAILED PLAN'}
        </Text>
      </View>

      {totalKcal > 0 && (
        <View style={styles.donutContainer}>
          <Svg height={120} width={120} viewBox="0 0 120 120">
            <G rotation="-90" origin="60, 60">
              <Circle cx="60" cy="60" r={radius} stroke="#FF3B30" strokeWidth={strokeWidth} strokeDasharray={`${pStroke} ${circumference}`} strokeDashoffset={-pOffset} fill="transparent" />
              <Circle cx="60" cy="60" r={radius} stroke="#FFD60A" strokeWidth={strokeWidth} strokeDasharray={`${cStroke} ${circumference}`} strokeDashoffset={-cOffset} fill="transparent" />
              <Circle cx="60" cy="60" r={radius} stroke="#0A84FF" strokeWidth={strokeWidth} strokeDasharray={`${fStroke} ${circumference}`} strokeDashoffset={-fOffset} fill="transparent" />
            </G>
            <SvgText x="60" y="55" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">
              {Math.round(totalKcal)}
            </SvgText>
            <SvgText x="60" y="72" textAnchor="middle" fill="#8E8E93" fontSize="10" fontWeight="bold">
              KCAL
            </SvgText>
          </Svg>
          
          <View style={styles.legendContainer}>
            <View style={styles.legendRow}><View style={[styles.legendDot, { backgroundColor: '#FF3B30' }]} /><Text style={styles.legendText}>PRO {Math.round(pPct*100)}% ({Math.round(p)}g)</Text></View>
            <View style={styles.legendRow}><View style={[styles.legendDot, { backgroundColor: '#0A84FF' }]} /><Text style={styles.legendText}>FAT {Math.round(fPct*100)}% ({Math.round(f)}g)</Text></View>
            <View style={styles.legendRow}><View style={[styles.legendDot, { backgroundColor: '#FFD60A' }]} /><Text style={styles.legendText}>CARB {Math.round(cPct*100)}% ({Math.round(c)}g)</Text></View>
          </View>
        </View>
      )}

      {(() => {
        const mealOrder: Record<string, number> = {
          'breakfast': 1,
          'snack': 2,
          'lunch': 3,
          'pre_workout': 4,
          'dinner': 5
        };
        const sortedMeals = Array.isArray(activeDay.meals) ? [...activeDay.meals].sort((a: any, b: any) => 
          (mealOrder[a.type?.toLowerCase()] || 99) - (mealOrder[b.type?.toLowerCase()] || 99)
        ) : [];

        return sortedMeals.map((meal: any, index: number) => (
          <View key={meal.id || index} style={{ backgroundColor: '#1C1C1E', padding: 20, borderRadius: 16, borderColor: '#2C2C2E', borderWidth: 1, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: '#FF3B30', fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>{String(meal.type || 'meal')}</Text>
              <Text style={{ color: '#8E8E93', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 }}>
                {String(meal.macros?.p || 0)}P / {String(meal.macros?.c || 0)}C / {String(meal.macros?.f || 0)}F
              </Text>
            </View>
            <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 4 }}>{String(meal.name || 'Unnamed Meal')}</Text>
            {Array.isArray(meal.ingredients) && (
              <Text style={{ color: '#8E8E93', fontSize: 14, lineHeight: 20, marginTop: 8 }}>
                {meal.ingredients.map((i:any) => `${String(i.qty)} ${String(i.item)}`).join(' • ')}
              </Text>
            )}
          </View>
        ));
      })()}
    </View>
  );
};

export default function PlannerScreen() {
  const { user } = useAuth();
  
  // Calculate next 14 days for horizontal calendar using Local Time to prevent UTC offsets
  const today = new Date();
  const weekDates = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return {
      dateObj: d,
      dateStr: `${year}-${month}-${day}`,
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      dayNum: d.getDate()
    };
  });

  const [selectedDate, setSelectedDate] = useState(weekDates[0].dateStr);

  const selectedDateRef = useRef(selectedDate);
  selectedDateRef.current = selectedDate;

  const weekDatesRef = useRef(weekDates);
  weekDatesRef.current = weekDates;

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 30 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderMove: (evt, gestureState) => {
        slideAnim.setValue(gestureState.dx);
      },
      onPanResponderRelease: (evt, gestureState) => {
        const currentSel = selectedDateRef.current;
        const currentDates = weekDatesRef.current;
        const idx = currentDates.findIndex(d => d.dateStr === currentSel);
        
        if (gestureState.dx > 50 && idx > 0) {
          // Slide right (previous day)
          Animated.parallel([
             Animated.timing(slideAnim, { toValue: 400, duration: 150, useNativeDriver: true }),
             Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true })
          ]).start(() => {
             setSelectedDate(currentDates[idx - 1].dateStr);
             slideAnim.setValue(-400);
             Animated.parallel([
               Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
               Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true })
             ]).start();
          });
        } else if (gestureState.dx < -50 && idx < currentDates.length - 1) {
          // Slide left (next day)
          Animated.parallel([
             Animated.timing(slideAnim, { toValue: -400, duration: 150, useNativeDriver: true }),
             Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true })
          ]).start(() => {
             setSelectedDate(currentDates[idx + 1].dateStr);
             slideAnim.setValue(400);
             Animated.parallel([
               Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
               Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true })
             ]).start();
          });
        } else {
          // Snaps back if the swipe wasn't far enough
          Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  const { data: weekPlan, isLoading } = useQuery({
    queryKey: ['weekPlan', user?.id, weekDates[0].dateStr, weekDates[13].dateStr],
    queryFn: () => fetchWeekPlan(user!.id, weekDates[0].dateStr, weekDates[13].dateStr),
    enabled: !!user,
  });

  const activeDay = weekPlan?.find((d: any) => d.date === selectedDate);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF3B30" style={styles.spinner} />
        <Text style={styles.loadingText}>Syncing Calendar...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Protocol Horizon</Text>
        
        {/* Horizontal Calendar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.calendarScroll}>
          {weekDates.map((item, idx) => {
            const isSelected = selectedDate === item.dateStr;
            const hasData = weekPlan?.some((d: any) => d.date === item.dateStr);

            return (
              <Pressable
                key={item.dateStr}
                onPress={() => {
                  if (selectedDate !== item.dateStr) {
                    setSelectedDate(item.dateStr);
                  }
                }}
                style={[styles.dateCard, isSelected ? styles.dateCardSelected : styles.dateCardDefault]}
              >
                <Text style={[styles.dayName, isSelected ? styles.dayNameSelected : styles.dayNameDefault]}>
                  {item.dayName}
                </Text>
                <Text style={[styles.dayNum, isSelected ? styles.dayNumSelected : styles.dayNumDefault]}>
                  {item.dayNum}
                </Text>
                {hasData && !isSelected && <View style={styles.dataIndicator} />}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={{ flex: 1 }} {...panResponder.panHandlers}>
        <Animated.ScrollView 
          style={[styles.contentScroll, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]} 
          contentContainerStyle={styles.contentScrollInner}
        >
          <MealList activeDay={activeDay} />
        </Animated.ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  spinner: { marginBottom: 16 },
  loadingText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  container: { flex: 1, backgroundColor: '#121212' },
  header: { paddingTop: 64, paddingHorizontal: 24, paddingBottom: 24, backgroundColor: '#1C1C1E', borderBottomColor: '#2C2C2E', borderBottomWidth: 1 },
  headerTitle: { color: 'white', fontSize: 30, fontWeight: 'bold', marginBottom: 24, letterSpacing: -0.5 },
  calendarScroll: { flexDirection: 'row' },
  dateCard: { alignItems: 'center', justifyContent: 'center', marginRight: 12, width: 64, height: 80, borderRadius: 16, borderWidth: 1 },
  dateCardSelected: { backgroundColor: '#FF3B30', borderColor: '#FF3B30', shadowColor: '#FF3B30', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  dateCardDefault: { backgroundColor: '#121212', borderColor: '#2C2C2E' },
  dayName: { fontSize: 12, fontWeight: 'bold', marginBottom: 4, letterSpacing: 0.5 },
  dayNameSelected: { color: 'white' },
  dayNameDefault: { color: '#8E8E93' },
  dayNum: { fontSize: 20, fontWeight: 'bold' },
  dayNumSelected: { color: 'white' },
  dayNumDefault: { color: 'white' },
  dataIndicator: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF3B30', marginTop: 4, position: 'absolute', bottom: 8 },
  contentScroll: { flex: 1, paddingHorizontal: 24 },
  contentScrollInner: { paddingTop: 24, paddingBottom: 48 },
  donutContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1C1E', paddingVertical: 20, paddingHorizontal: 16, borderRadius: 16, borderColor: '#2C2C2E', borderWidth: 1, marginBottom: 24 },
  legendContainer: { marginLeft: 24, justifyContent: 'center' },
  legendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legendText: { color: 'white', fontSize: 13, fontWeight: 'bold' },
});
