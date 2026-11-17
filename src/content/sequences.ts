// Maps existing vehicle scenarios onto animated stage sequences WITHOUT changing scenario ids, options, or grading.
// Each option is tagged with the physical action the officer takes if the player picks it ('search' or 'stop').
export type Act = 'search' | 'stop';
export interface Hotspot { id: string; label: string; x: number; y: number; fact: number; who: string; line?: string }
export interface Finding { sprite: string; name: string; where: string }
export interface VehicleSeq {
  scenarioId: string;
  arrestee: 'patrol' | 'standing' | 'none';
  hotspots: Hotspot[];
  acts: Record<string, Act>;         // option id → officer action
  finding?: Finding;                 // what the search turns up (only seen if a search happens)
  searchSpot: 'cabin' | 'glove';
}
const patrolHot = (fact: number, label: string, line?: string): Hotspot => ({ id: 'arrestee', label, x: 440, y: 232, fact, who: 'Arrestee', line });
const carHot = (fact: number, label: string): Hotspot => ({ id: 'vehicle', label, x: 300, y: 242, fact, who: 'Vehicle' });
const brooksHot = (fact: number, label: string): Hotspot => ({ id: 'officer', label, x: 262, y: 246, fact, who: 'Officer Brooks' });

export const VEHICLE_SEQS: VehicleSeq[] = [
  { scenarioId: 'S6-GANT-1', arrestee: 'patrol', searchSpot: 'cabin', hotspots: [patrolHot(0, 'The arrestee'), brooksHot(1, 'Brooks: arrest report'), carHot(2, 'Passenger compartment')],
    acts: { a: 'stop', b: 'search', c: 'search', d: 'stop' }, finding: { sprite: 'ev/baggie', name: 'Baggie of white powder', where: 'under the driver\'s seat' } },
  { scenarioId: 'S6-GANT-2', arrestee: 'patrol', searchSpot: 'glove', hotspots: [patrolHot(0, 'The arrestee'), brooksHot(1, 'Brooks: arrest report'), carHot(2, 'Glove box')],
    acts: { a: 'search', b: 'stop', c: 'stop', d: 'search' }, finding: { sprite: 'ev/pills', name: 'Baggie of pills', where: 'glove box' } },
  { scenarioId: 'S6-GANT-3', arrestee: 'standing', searchSpot: 'cabin', hotspots: [patrolHot(0, 'The arrestee'), brooksHot(1, 'Brooks: arrest report'), carHot(2, 'Open driver\'s door')],
    acts: { a: 'search', b: 'stop', c: 'stop', d: 'search' }, finding: { sprite: 'ev/knife', name: 'Folding knife', where: 'driver\'s seat' } },
  { scenarioId: 'S6-VEH-1', arrestee: 'patrol', searchSpot: 'cabin', hotspots: [carHot(0, 'Car window: what is visible'), brooksHot(1, 'Brooks: vehicle status')],
    acts: { a: 'search', b: 'stop', c: 'stop', d: 'search' }, finding: { sprite: 'ev/blade', name: 'Razor blade with white residue', where: 'on the seat' } },
  { scenarioId: 'S6-VEH-2', arrestee: 'none', searchSpot: 'cabin', hotspots: [carHot(0, 'Car window: what is visible'), brooksHot(1, 'Brooks: vehicle status')],
    acts: { a: 'stop', b: 'search', c: 'search', d: 'stop' }, finding: { sprite: 'ev/baggie', name: 'Small baggie', where: 'center console' } },
  { scenarioId: 'S6-VEH-3', arrestee: 'patrol', searchSpot: 'cabin', hotspots: [patrolHot(0, 'The arrestee'), carHot(1, 'Passenger seat'), brooksHot(2, 'Brooks: vehicle status')],
    acts: { a: 'search', b: 'search', c: 'stop', d: 'search' }, finding: { sprite: 'ev/pills', name: 'Bag of illegal pills', where: 'passenger seat' } },
];
export const seqFor = (id: string) => VEHICLE_SEQS.find(s => s.scenarioId === id);
