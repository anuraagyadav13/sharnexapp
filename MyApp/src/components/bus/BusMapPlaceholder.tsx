import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Svg, { Rect, Path, Circle, G, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../store/ThemeContext';

interface BusMapPlaceholderProps {
  height?: number;
  showLiveBadge?: boolean;
  showRoutePath?: boolean;
  onOpenFullMap?: () => void;
  ctaText?: string;
}

export const BusMapPlaceholder: React.FC<BusMapPlaceholderProps> = ({
  height = 240,
  showLiveBadge = true,
  showRoutePath = true,
  onOpenFullMap,
  ctaText = 'Open Full Fleet Tracking',
}) => {
  const { theme, isDarkMode } = useTheme();

  // Colors adapted to light/dark themes
  const mapBg = isDarkMode ? '#131127' : '#E8EEF5';
  const gridLine = isDarkMode ? '#1F1B3A' : '#D5E0EB';
  const roadColor = isDarkMode ? '#242045' : '#FFFFFF';
  const mainRoadColor = isDarkMode ? '#2E2958' : '#D1DCE8';
  const waterColor = isDarkMode ? '#0F1A30' : '#C7DCF5';
  const parkColor = isDarkMode ? '#122524' : '#D3EBDC';

  return (
    <View style={[styles.container, { height, backgroundColor: mapBg, borderColor: theme.border }]}>
      <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#8B5CF6" stopOpacity="1" />
            <Stop offset="100%" stopColor="#3B82F6" stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {/* Map Base Grid & Water Body */}
        <Path d="M 0,0 L 400,0 L 400,300 L 0,300 Z" fill={mapBg} />
        
        {/* Park / Green Areas */}
        <Path d="M 20,40 Q 60,20 100,50 T 180,30 L 160,100 L 30,110 Z" fill={parkColor} opacity={0.7} />
        <Path d="M 260,160 Q 320,140 370,180 L 390,260 L 280,270 Z" fill={parkColor} opacity={0.6} />

        {/* Water Body (River curve) */}
        <Path d="M -10,180 Q 80,140 160,200 T 350,220 L 400,300 L -10,300 Z" fill={waterColor} opacity={0.8} />

        {/* Grid Street Network */}
        <Path d="M 0,50 H 400 M 0,110 H 400 M 0,170 H 400 M 0,230 H 400" stroke={gridLine} strokeWidth="1" opacity={0.6} />
        <Path d="M 50,0 V 300 M 130,0 V 300 M 220,0 V 300 M 310,0 V 300" stroke={gridLine} strokeWidth="1" opacity={0.6} />

        {/* Secondary Roads */}
        <Path d="M 10,80 Q 120,70 200,120 T 380,100" stroke={roadColor} strokeWidth="6" fill="none" />
        <Path d="M 90,0 Q 80,140 140,300" stroke={roadColor} strokeWidth="6" fill="none" />

        {/* Primary Highway / Arterial Roads */}
        <Path d="M 0,140 H 400" stroke={mainRoadColor} strokeWidth="10" />
        <Path d="M 240,0 V 300" stroke={mainRoadColor} strokeWidth="10" />

        {showRoutePath && (
          <>
            {/* Geofence Radii Rings */}
            <Circle cx="70" cy="80" r="24" fill="#8B5CF6" opacity={0.15} stroke="#8B5CF6" strokeWidth="1" strokeDasharray="3 3" />
            <Circle cx="190" cy="140" r="30" fill="#8B5CF6" opacity={0.18} stroke="#8B5CF6" strokeWidth="1" strokeDasharray="3 3" />
            <Circle cx="310" cy="90" r="22" fill="#3B82F6" opacity={0.15} stroke="#3B82F6" strokeWidth="1" strokeDasharray="3 3" />

            {/* Connected Route Polyline */}
            <Path
              d="M 70,80 L 140,110 L 190,140 L 260,115 L 310,90"
              stroke="url(#routeGrad)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />

            {/* Numbered Stop Markers */}
            {/* Stop 1 */}
            <Circle cx="70" cy="80" r="10" fill="#7C3AED" />
            <SvgText x="70" y="84" fill="#FFF" fontSize="10" fontWeight="bold" textAnchor="middle">1</SvgText>

            {/* Stop 2 */}
            <Circle cx="140" cy="110" r="10" fill="#7C3AED" />
            <SvgText x="140" y="114" fill="#FFF" fontSize="10" fontWeight="bold" textAnchor="middle">2</SvgText>

            {/* Stop 3 (Active Bus Location) */}
            <Circle cx="190" cy="140" r="14" fill="#10B981" />
            <Circle cx="190" cy="140" r="8" fill="#FFFFFF" />
            <SvgText x="190" y="144" fill="#10B981" fontSize="9" fontWeight="bold" textAnchor="middle">BUS</SvgText>

            {/* Stop 4 */}
            <Circle cx="260" cy="115" r="10" fill="#3B82F6" />
            <SvgText x="260" y="119" fill="#FFF" fontSize="10" fontWeight="bold" textAnchor="middle">4</SvgText>

            {/* Stop 5 */}
            <Circle cx="310" cy="90" r="10" fill="#3B82F6" />
            <SvgText x="310" y="94" fill="#FFF" fontSize="10" fontWeight="bold" textAnchor="middle">5</SvgText>
          </>
        )}
      </Svg>

      {/* Top Badges Overlay */}
      <View style={styles.topBadgeRow}>
        {showLiveBadge && (
          <View style={styles.liveZoneBadge}>
            <View style={styles.livePulseDot} />
            <Text style={styles.liveZoneText}>LIVE ZONES ACTIVE</Text>
          </View>
        )}

        <View style={styles.mapToolsRow}>
          <TouchableOpacity style={styles.mapToolBtn} activeOpacity={0.7}>
            <Ionicons name="add" size={16} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.mapToolBtn} activeOpacity={0.7}>
            <Ionicons name="remove" size={16} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.mapToolBtn} activeOpacity={0.7}>
            <Ionicons name="locate-outline" size={16} color="#7C3AED" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom CTA Button */}
      {onOpenFullMap && (
        <View style={styles.bottomCtaContainer}>
          <TouchableOpacity
            style={styles.ctaButton}
            activeOpacity={0.8}
            onPress={onOpenFullMap}
          >
            <Ionicons name="map-outline" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.ctaButtonText}>{ctaText}</Text>
            <Ionicons name="chevron-forward" size={16} color="#FFFFFF" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
    justifyContent: 'space-between',
  },
  topBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  liveZoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#7C3AED',
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  liveZoneText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  mapToolsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  mapToolBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  bottomCtaContainer: {
    padding: 12,
    alignItems: 'center',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
