import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../src/context/AuthContext';
import { fetchWeekPlan } from '../../src/api/plan';
import { CheckSquare } from 'lucide-react-native';

export default function ShopScreen() {
  const { user } = useAuth();
  
  const today = new Date();
  const getLocalStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  
  const todayStr = getLocalStr(today);
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  const nextWeekStr = getLocalStr(nextWeek);

  const { data: weekPlan, isLoading } = useQuery({
    queryKey: ['weekPlan', user?.id, todayStr, nextWeekStr],
    queryFn: () => fetchWeekPlan(user!.id, todayStr, nextWeekStr),
    enabled: !!user,
  });

  const [expandedItem, setExpandedItem] = useState<{ cat: string, item: string } | null>(null);

  // Name normalization
  const normalizeItemName = (name: string) => {
    // 1. Remove anything in parentheses and convert to lower case
    let cleanName = name.replace(/\([^)]*\)/g, '').toLowerCase();

    // 2. Remove punctuation and numbers
    cleanName = cleanName.replace(/[^\w\s]|[\d]/g, ' ');

    // 3. Noise words to strip out (adjectives, preparations, measurements)
    const noiseWords = new Set([
      // Preparations & states
      'scrambled', 'whole', 'poached', 'fried', 'boiled', 'hard', 'soft', 'mashed', 'roasted', 
      'grilled', 'baked', 'steamed', 'smoked', 'pickled', 'canned', 'dried', 'frozen', 'fresh', 
      'raw', 'cooked', 'diced', 'chopped', 'sliced', 'minced', 'peeled', 'crushed', 'grated', 
      'shredded', 'washed', 'halved', 'quartered', 'toasted', 'crumbled', 'ground', 'beaten', 
      'melted', 'softened', 'chilled', 'thick', 'thin',
      
      // Adjectives & quality
      'organic', 'natural', 'pure', 'extra', 'virgin', 'boneless', 'skinless', 'unsweetened', 
      'sweetened', 'lean', 'fat', 'free', 'grass', 'fed', 'wild', 'caught', 'pasture', 'raised', 
      'light', 'dark', 'white', 'brown', 'red', 'green', 'yellow', 'black', 'purple', 'sweet', 
      'sour', 'spicy', 'hot', 'mild', 'cold', 'warm', 'room', 'temperature', 'large', 'small', 'medium',
      
      // Conjunctions/misc
      'of', 'with', 'and', 'or', 'to', 'taste', 'strips', 'cubes', 'chunks', 'fillets', 'patties', 'paste', 'extract',
      
      // Measurements that might have slipped into the name
      'cup', 'cups', 'oz', 'ounce', 'ounces', 'g', 'gram', 'grams', 'kg', 'kilo', 'kilogram', 'kilograms',
      'lb', 'lbs', 'pound', 'pounds', 'ml', 'l', 'liter', 'liters', 'tbsp', 'tsp',
      'tablespoon', 'tablespoons', 'teaspoon', 'teaspoons', 'pinch', 'dash',
      'handful', 'bunch', 'clove', 'cloves', 'slice', 'slices', 'piece', 'pieces',
      'package', 'packages', 'can', 'cans', 'jar', 'jars', 'bottle', 'bottles', 'box', 'boxes',
      'bag', 'bags', 'scoop', 'scoops', 'head', 'heads', 'stalk', 'stalks', 'sprig', 'sprigs', 'leaf', 'leaves', 'drop', 'drops'
    ]);
    
    // 4. Tokenize, filter noise, and singularize
    let tokens = cleanName.split(/\s+/)
      .filter(w => w.length > 0 && !noiseWords.has(w))
      .map(w => {
         // Basic singularization for ingredients
         if (w === 'berries') return 'berry';
         if (w === 'tomatoes') return 'tomato';
         if (w === 'potatoes') return 'potato';
         if (w === 'cherries') return 'cherry';
         if (w === 'leaves') return 'leaf';
         if (w === 'halves') return 'half';
         
         // Don't strip 's' if it belongs to words ending in ss, us, is, os, as, ous
         if (w.match(/([suihoa]s|ous)$/)) return w;
         // Strip trailing 's' for words longer than 3 chars
         if (w.endsWith('s') && w.length > 3) return w.slice(0, -1);
         return w;
      });

    // 5. Rejoin and Title Case
    // Fallback if everything was stripped (e.g., name was just "Large Cup")
    const finalTokens = tokens.length > 0 ? tokens : cleanName.split(/\s+/).filter(w => w.length > 0);
    const finalStr = finalTokens.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    
    // Explicit user preference overrides
    if (finalStr === 'Egg') return 'Eggs';
    
    return finalStr;
  };

  // Determine user unit preference (simple proxy: en-US usually means Imperial)
  const isImperial = Intl.DateTimeFormat().resolvedOptions().locale === 'en-US';

  // Unit conversion to a base (grams for weight, ml for volume)
  const parseQuantity = (qtyStr: string): { amount: number, unit: string, baseType: 'weight'|'volume'|'count' } => {
    const match = qtyStr.toLowerCase().match(/([\d.]+)\s*([a-z]+)?/);
    if (!match) return { amount: 1, unit: '', baseType: 'count' };
    
    let amount = parseFloat(match[1]) || 1;
    let unit = (match[2] || '').trim();

    if (['g', 'gram', 'grams'].includes(unit)) return { amount, unit: 'g', baseType: 'weight' };
    if (['kg', 'kilogram', 'kilo'].includes(unit)) return { amount: amount * 1000, unit: 'g', baseType: 'weight' };
    if (['oz', 'ounce', 'ounces'].includes(unit)) return { amount: amount * 28.3495, unit: 'g', baseType: 'weight' };
    if (['lb', 'lbs', 'pound', 'pounds'].includes(unit)) return { amount: amount * 453.592, unit: 'g', baseType: 'weight' };
    
    if (['ml', 'milliliter', 'milliliters'].includes(unit)) return { amount, unit: 'ml', baseType: 'volume' };
    if (['l', 'liter', 'liters'].includes(unit)) return { amount: amount * 1000, unit: 'ml', baseType: 'volume' };
    if (['cup', 'cups'].includes(unit)) return { amount: amount * 240, unit: 'ml', baseType: 'volume' };
    if (['tbsp', 'tablespoon', 'tablespoons'].includes(unit)) return { amount: amount * 15, unit: 'ml', baseType: 'volume' };
    if (['tsp', 'teaspoon', 'teaspoons'].includes(unit)) return { amount: amount * 5, unit: 'ml', baseType: 'volume' };
    if (['fl', 'fl oz', 'fluid ounce'].includes(unit)) return { amount: amount * 29.5735, unit: 'ml', baseType: 'volume' };

    return { amount, unit: unit || 'item', baseType: 'count' };
  };

  const formatQuantity = (amount: number, baseType: 'weight'|'volume'|'count'): string => {
    if (baseType === 'count') return amount.toString();
    
    if (isImperial) {
      if (baseType === 'weight') {
        const oz = amount / 28.3495;
        if (oz >= 16) return `${(oz / 16).toFixed(1)} lbs`;
        return `${Math.round(oz)} oz`;
      } else if (baseType === 'volume') {
        const cups = amount / 240;
        if (cups >= 1) return `${cups.toFixed(1)} cups`;
        const tbsp = amount / 15;
        return `${Math.round(tbsp)} tbsp`;
      }
    } else {
      if (baseType === 'weight') {
        if (amount >= 1000) return `${(amount / 1000).toFixed(1)} kg`;
        return `${Math.round(amount)} g`;
      } else if (baseType === 'volume') {
        if (amount >= 1000) return `${(amount / 1000).toFixed(1)} L`;
        return `${Math.round(amount)} ml`;
      }
    }
    return Math.round(amount).toString();
  };

  const groceryList = useMemo(() => {
    if (!weekPlan) return {};
    
    type Source = { date: string, mealType: string, mealName: string, originalQty: string };
    
    // Aggregate ingredients into buckets and deduplicate by normalized name
    const grouped: Record<string, Record<string, { baseAmount: number, baseType: 'weight'|'volume'|'count', sources: Source[] }>> = {};
    
    weekPlan.forEach((day: any) => {
      if (day.status === 'detailed' && day.meals) {
        day.meals.forEach((meal: any) => {
          meal.ingredients?.forEach((ing: any) => {
            // Normalize AI's erratic categories into broader static buckets
            let rawCat = (ing.category || 'Other').toUpperCase();
            let cat = 'MISC PANTRY';
            if (rawCat.includes('PROT') || rawCat.includes('MEAT') || rawCat.includes('POULTRY') || rawCat.includes('FISH') || rawCat.includes('EGG')) cat = '🥩 PROTEINS';
            else if (rawCat.includes('FAT') || rawCat.includes('OIL') || rawCat.includes('NUT') || rawCat.includes('SEED') || rawCat.includes('AVOCADO')) cat = '🥑 HEALTHY FATS';
            else if (rawCat.includes('CARB') || rawCat.includes('GRAIN') || rawCat.includes('STARCH') || rawCat.includes('OAT') || rawCat.includes('RICE')) cat = '🌾 CARBOHYDRATES';
            else if (rawCat.includes('VEG') || rawCat.includes('FRUIT') || rawCat.includes('PRODUCE') || rawCat.includes('BERR')) cat = '🥦 PRODUCE';
            else if (rawCat.includes('DAIRY') || rawCat.includes('MILK') || rawCat.includes('YOGURT') || rawCat.includes('CHEESE')) cat = '🥛 DAIRY & ALTS';
            else if (rawCat.includes('HERB') || rawCat.includes('SPICE') || rawCat.includes('SEASONING') || rawCat.includes('SALT')) cat = '🌿 HERBS & SPICES';

            if (!grouped[cat]) grouped[cat] = {};
            
            const normalizedName = normalizeItemName(ing.item);
            const { amount, baseType } = parseQuantity(String(ing.qty || ''));
            
            if (grouped[cat][normalizedName]) {
                // If types mismatch (e.g. one went to 'count' because of weird unit, we just add it to 'count')
                // For a robust app we'd convert count to weight if possible, but for MVP we sum if type matches.
                if (grouped[cat][normalizedName].baseType === baseType) {
                    grouped[cat][normalizedName].baseAmount += amount;
                }
                grouped[cat][normalizedName].sources.push({
                   date: day.date,
                   mealType: meal.type,
                   mealName: meal.name,
                   originalQty: ing.qty
                });
            } else {
                grouped[cat][normalizedName] = { 
                   baseAmount: amount, 
                   baseType,
                   sources: [{
                      date: day.date,
                      mealType: meal.type,
                      mealName: meal.name,
                      originalQty: ing.qty
                   }]
                };
            }
          });
        });
      }
    });
    
    // Transform into array format for rendering
    const formattedGrouped: Record<string, { item: string, qty: string, sources: Source[] }[]> = {};
    Object.keys(grouped).forEach(cat => {
        formattedGrouped[cat] = Object.keys(grouped[cat]).map(itemName => ({
            item: itemName,
            qty: formatQuantity(grouped[cat][itemName].baseAmount, grouped[cat][itemName].baseType),
            sources: grouped[cat][itemName].sources
        }));
    });

    return formattedGrouped;
  }, [weekPlan, isImperial]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-bioblack justify-center items-center px-6">
        <ActivityIndicator size="large" color="#FF3B30" className="mb-4" />
        <Text className="text-white text-xl font-bold animate-pulse">Aggregating Supplies...</Text>
      </View>
    );
  }

  const categories = Object.keys(groceryList);

  return (
    <ScrollView className="flex-1 bg-bioblack">
      <View className="pt-16 px-6 pb-6 bg-biodark border-b border-biogrey">
        <Text className="text-gray-400 uppercase font-bold tracking-widest mb-1 text-xs">Horizon: {todayStr} - {nextWeekStr}</Text>
        <Text className="text-white text-3xl font-bold tracking-tight">Procurement List</Text>
      </View>

      <View className="px-6 py-8">
        {categories.length === 0 ? (
          <View className="items-center justify-center mt-12 bg-biodark p-10 rounded-3xl border border-biogrey border-dashed">
            <Text className="text-gray-400 text-center text-lg">No ingredients required for this phase horizon.</Text>
          </View>
        ) : (
          categories.map(cat => (
            <View key={cat} className="mb-8">
              <Text className="text-biored font-bold text-lg uppercase tracking-widest mb-4 border-b border-biogrey pb-2">{cat}</Text>
              
              <View className="space-y-3">
                {groceryList[cat].map((ing, idx) => {
                  const isExpanded = expandedItem?.cat === cat && expandedItem?.item === ing.item;
                  return (
                    <View key={idx} className="bg-biodark rounded-xl border border-biogrey overflow-hidden my-1">
                      <TouchableOpacity 
                        className="flex-row items-center p-4"
                        onPress={() => setExpandedItem(isExpanded ? null : { cat, item: ing.item })}
                      >
                        <CheckSquare color="#4CAF50" size={20} className="opacity-50" />
                        <Text className="text-white text-lg font-medium flex-1 ml-2">{ing.item}</Text>
                        <Text className="text-gray-400 font-bold">{ing.qty}</Text>
                      </TouchableOpacity>
                      
                      {isExpanded && (
                        <View className="px-4 pb-4 bg-bioblack/50 border-t border-biogrey">
                          <Text className="text-biored text-xs font-bold tracking-widest uppercase mb-2 mt-3">Scheduled Usage</Text>
                          {ing.sources.map((src, sIdx) => (
                             <View key={sIdx} className="flex-row justify-between items-center mb-2">
                               <View className="flex-1">
                                 <Text className="text-gray-300 text-sm font-medium">{src.mealName}</Text>
                                 <Text className="text-gray-500 text-xs">{src.date} • {src.mealType}</Text>
                               </View>
                               <Text className="text-gray-400 text-xs font-bold bg-biodark px-2 py-1 rounded">{src.originalQty}</Text>
                             </View>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
