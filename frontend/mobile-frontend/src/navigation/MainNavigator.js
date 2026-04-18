import React, { useState, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, {
  Rect, Circle, Line, Path, Polyline, Ellipse,
} from 'react-native-svg';
import { colors } from '../theme/colors';
import { W, H, rs, rv, clamp, font } from '../theme/responsive';
import DashboardScreen from '../screens/home/DashboardScreen';
import TasksScreen     from '../screens/tasks/TasksScreen';
import TimerScreen     from '../screens/timer/TimerScreen';
import StatsScreen     from '../screens/stats/StatsScreen';
import ScheduleScreen  from '../screens/schedule/ScheduleScreen';
import ProfileScreen   from '../screens/profile/ProfileScreen';

// ─── TAB HEIGHT ────────────────────────────────────────────────────────────
const TAB_H      = clamp(H * 0.085, 60, 80);
const ICON_SIZE  = clamp(W * 0.055, 20, 26);
const DOT_SIZE   = 5;

// ─── ICONS ─────────────────────────────────────────────────────────────────
const HomeIcon = ({ active }) => (
  <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
    <Rect x="3"  y="3"  width="8" height="8" rx="1.5"
      fill={active ? colors.accent : 'none'}
      stroke={active ? colors.accent : colors.textSecondary} strokeWidth="1.8"/>
    <Rect x="13" y="3"  width="8" height="8" rx="1.5"
      fill={active ? colors.primary : 'none'}
      stroke={active ? colors.primary : colors.textSecondary} strokeWidth="1.8"/>
    <Rect x="3"  y="13" width="8" height="8" rx="1.5"
      fill={active ? colors.primary : 'none'}
      stroke={active ? colors.primary : colors.textSecondary} strokeWidth="1.8"/>
    <Rect x="13" y="13" width="8" height="8" rx="1.5"
      fill={active ? colors.accent : 'none'}
      stroke={active ? colors.accent : colors.textSecondary} strokeWidth="1.8"/>
  </Svg>
);

const TasksIcon = ({ active }) => {
  const c = active ? colors.primary : colors.textSecondary;
  return (
    <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="5" width="7" height="7" rx="1.5"
        fill={active ? '#E8F0FE' : 'none'} stroke={c} strokeWidth="1.8"/>
      {active && (
        <Path d="M4.5 8.5l2 2 3-3" stroke={colors.primary}
          strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      )}
      <Line x1="13" y1="7"  x2="21" y2="7"  stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
      <Line x1="13" y1="10" x2="19" y2="10" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
      <Rect x="3" y="14" width="7" height="7" rx="1.5"
        fill="none" stroke={c} strokeWidth="1.8"/>
      <Line x1="13" y1="16" x2="21" y2="16" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
      <Line x1="13" y1="19" x2="17" y2="19" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
    </Svg>
  );
};

const ScheduleIcon = ({ active }) => {
  const c = active ? colors.primary : colors.textSecondary;
  return (
    <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="17" rx="2"
        fill={active ? '#E8F0FE' : 'none'} stroke={c} strokeWidth="1.8"/>
      <Rect x="3" y="4" width="18" height="5" rx="2"
        fill={active ? colors.primary : colors.textSecondary}/>
      <Line x1="8"  y1="2" x2="8"  y2="6" stroke={active ? '#fff' : c} strokeWidth="2" strokeLinecap="round"/>
      <Line x1="16" y1="2" x2="16" y2="6" stroke={active ? '#fff' : c} strokeWidth="2" strokeLinecap="round"/>
      {[7,12,17].map(x => [13,17].map(y => (
        <Circle key={`${x}${y}`} cx={x} cy={y} r="1.2"
          fill={active ? colors.primary : colors.textSecondary}/>
      )))}
    </Svg>
  );
};

const TimerIcon = ({ active }) => {
  const c = active ? colors.primary : colors.textSecondary;
  return (
    <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="13" r="8"
        fill={active ? '#E8F0FE' : 'none'} stroke={c} strokeWidth="1.8"/>
      <Rect x="9" y="2" width="6" height="3" rx="1.5"
        fill={active ? colors.primary : colors.textSecondary}/>
      <Line x1="20" y1="7" x2="22" y2="5" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
      <Line x1="12" y1="13" x2="15" y2="9"
        stroke={active ? colors.accent : c}
        strokeWidth="2" strokeLinecap="round"/>
      <Circle cx="12" cy="13" r="1.5"
        fill={active ? colors.accent : colors.textSecondary}/>
    </Svg>
  );
};

const StatsIcon = ({ active }) => {
  const c = active ? colors.primary : colors.textSecondary;
  return (
    <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
      <Line x1="3" y1="19" x2="21" y2="19" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <Rect x="4"  y="12" width="4" height="7" rx="1"
        fill={active ? '#C8D8FF' : colors.textSecondary} opacity={active ? 1 : 0.4}/>
      <Rect x="10" y="7"  width="4" height="12" rx="1"
        fill={active ? colors.primary : colors.textSecondary}/>
      <Rect x="16" y="10" width="4" height="9"  rx="1"
        fill={active ? '#C8D8FF' : colors.textSecondary} opacity={active ? 1 : 0.4}/>
      <Polyline points="6,11 12,6 18,9"
        stroke={active ? colors.accent : 'transparent'}
        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <Circle cx="18" cy="9" r="2"
        fill={active ? colors.accent : 'transparent'}/>
    </Svg>
  );
};

const ProfileIcon = ({ active }) => {
  const c = active ? colors.primary : colors.textSecondary;
  return (
    <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9"
        fill={active ? '#E8F0FE' : 'none'} stroke={c} strokeWidth="1.8"/>
      <Circle cx="12" cy="9" r="3"
        fill={active ? colors.accent : colors.textSecondary}/>
      <Path d="M5.5 19.5C5.5 16.5 8.5 14 12 14s6.5 2.5 6.5 5.5"
        stroke={c} strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    </Svg>
  );
};

// ─── TABS DEFINITION ───────────────────────────────────────────────────────
const TABS = [
  { key: 'home',     label: 'Inicio',   Icon: HomeIcon     },
  { key: 'tasks',    label: 'Tareas',   Icon: TasksIcon    },
  { key: 'schedule', label: 'Horario',  Icon: ScheduleIcon },
  { key: 'timer',    label: 'Timer',    Icon: TimerIcon    },
  { key: 'stats',    label: 'Stats',    Icon: StatsIcon    },
  { key: 'profile',  label: 'Perfil',   Icon: ProfileIcon  },
];

// ─── MAIN NAVIGATOR ────────────────────────────────────────────────────────
// FIX: Todas las pantallas se mantienen montadas (display: 'none' en vez de
// desmontar). Esto elimina el re-fetch y re-render en cada cambio de tab.
export default function MainNavigator() {
  const [activeTab,  setActiveTab]  = useState('home');
  const [navVisible, setNavVisible] = useState(false);
  const [subScreen,  setSubScreen]  = useState(false);
  // Contador que sube cada vez que TasksScreen modifica algo.
  // DashboardScreen lo observa y recarga sus datos cuando cambia.
  const [tasksVersion, setTasksVersion] = useState(0);

  const handleReady        = useCallback(() => setNavVisible(true),          []);
  const handleSubScreen    = useCallback((val) => setSubScreen(!!val),        []);
  const notifyTasksChanged = useCallback(() => setTasksVersion(v => v + 1),  []);

  const showNav = navVisible && !subScreen;

  return (
    <View style={s.root}>
      <View style={[s.content, showNav && { paddingBottom: TAB_H }]}>

        {/* ── Dashboard ── siempre montado */}
        <View style={[s.screen, activeTab !== 'home' && s.hidden]}>
          <DashboardScreen
            onReady={handleReady}
            onNavigate={(tab) => setActiveTab(tab)}
            tasksVersion={tasksVersion}
          />
        </View>

        {/* ── Tasks ── siempre montado, evita re-fetch al volver */}
        <View style={[s.screen, activeTab !== 'tasks' && s.hidden]}>
          <TasksScreen
            onSubScreen={handleSubScreen}
            onNavigate={(tab) => setActiveTab(tab)}
            navHeight={TAB_H}
            onTasksChanged={notifyTasksChanged}
          />
        </View>

        {/* ── Horario ── */}
        <View style={[s.screen, activeTab !== 'schedule' && s.hidden]}>
          <ScheduleScreen navHeight={TAB_H} onSubScreen={handleSubScreen}/>
        </View>

        {/* ── Timer ── */}
        <View style={[s.screen, activeTab !== 'timer' && s.hidden]}>
          <TimerScreen />
        </View>

        {/* ── Stats ── */}
        <View style={[s.screen, activeTab !== 'stats' && s.hidden]}>
          <StatsScreen />
        </View>

        {/* ── Perfil ── */}
        <View style={[s.screen, activeTab !== 'profile' && s.hidden]}>
          <ProfileScreen />
        </View>

      </View>

      {/* Navbar — solo visible cuando showNav === true */}
      {showNav && (
        <View style={s.navbar}>
          {TABS.map(({ key, label, Icon }) => {
            const active = activeTab === key;
            return (
              <TouchableOpacity
                key={key}
                style={s.tab}
                onPress={() => setActiveTab(key)}
                activeOpacity={0.75}>
                {active && <View style={s.activePill}/>}
                <Icon active={active}/>
                <View style={{ height: 3 }}/>
                <View style={s.labelRow}>
                  {active && <View style={s.dot}/>}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

// ─── STYLES ────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  // Pantalla visible: ocupa todo el espacio disponible
  screen: {
    ...StyleSheet.absoluteFillObject,
  },
  // Pantalla oculta: display none — sigue montada pero no renderiza ni bloquea
  hidden: {
    display: 'none',
  },
  navbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: TAB_H,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EAECF4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 12,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
    paddingBottom: 4,
    position: 'relative',
  },
  activePill: {
    position: 'absolute',
    top: 0,
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: DOT_SIZE,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: colors.accent,
  },
});
