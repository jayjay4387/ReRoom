import { ComponentProps } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import CheckIcon from '@hugeicons/core-free-icons/CheckIcon';
import { GLASS } from '../constants/theme';

type IconType = ComponentProps<typeof HugeiconsIcon>['icon'];

type Props = {
  steps: string[];
  current: number; // 1-indexed; 0 = not started
};

const NODE = 30;

export default function ProgressSteps({ steps, current }: Props) {
  return (
    <View>
      {steps.map((label, i) => {
        const num = i + 1;
        const done = num < current;
        const active = num === current;

        return (
          <View key={i}>
            <View style={styles.row}>
              <View
                style={[
                  styles.node,
                  done && styles.nodeDone,
                  active && styles.nodeActive,
                ]}
              >
                {done ? (
                  <HugeiconsIcon icon={CheckIcon as IconType} size={14} color="#ffffff" />
                ) : (
                  <Text style={[styles.nodeNum, !active && styles.nodeNumMuted]}>
                    {num}
                  </Text>
                )}
              </View>

              <Text
                style={[
                  styles.label,
                  done && styles.labelDone,
                  active && styles.labelActive,
                ]}
              >
                {label}
              </Text>
            </View>

            {i < steps.length - 1 && (
              <View
                style={[styles.connector, done && styles.connectorDone]}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },

  node: {
    width: NODE,
    height: NODE,
    borderRadius: NODE / 2,
    borderWidth: 1.5,
    borderColor: 'rgba(180,230,255,0.6)',
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeDone: { backgroundColor: '#3BBF48', borderColor: '#3BBF48' },
  nodeActive: { backgroundColor: '#2B8ADB', borderColor: '#2B8ADB' },

  nodeNum: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  nodeNumMuted: { color: 'rgba(15,59,85,0.45)' },

  label: { flex: 1, fontSize: 13, fontWeight: '500', color: 'rgba(15,59,85,0.45)' },
  labelActive: { color: GLASS.textDark, fontWeight: '700' },
  labelDone: { color: '#3BBF48', fontWeight: '600' },

  // connector sits under the left node column
  connector: {
    width: 2,
    height: 14,
    marginVertical: 3,
    marginLeft: NODE / 2 - 1,
    borderRadius: 1,
    backgroundColor: 'rgba(180,230,255,0.4)',
  },
  connectorDone: { backgroundColor: '#3BBF48' },
});
