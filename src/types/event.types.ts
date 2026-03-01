export type EventType = 
  | 'auth:login' 
  | 'auth:logout'
  | 'layout:change'
  | 'message:new'
  | 'message:edit'
  | 'message:delete'
  | 'music:playing'
  | 'music:add'
  | 'game:detected'
  | 'governor:high-cpu'
  | 'governor:cpu-normal'
  | 'screenshare:started'
  | 'remoteshare:started';

export interface AppEvent<T = any> {
  type: EventType;
  payload: T;
  timestamp: number;
}
