import { trigger, transition, style, animate, query, stagger, keyframes, state } from '@angular/animations';

// Fade in animation
export const fadeIn = trigger('fadeIn', [
  transition(':enter', [
    style({ opacity: 0 }),
    animate('300ms ease-in', style({ opacity: 1 }))
  ])
]);

// Fade in up animation
export const fadeInUp = trigger('fadeInUp', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(20px)' }),
    animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
  ])
]);

// Fade in right animation
export const fadeInRight = trigger('fadeInRight', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateX(-20px)' }),
    animate('400ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
  ])
]);

// List stagger animation
export const listStagger = trigger('listStagger', [
  transition('* => *', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(15px)' }),
      stagger('50ms', animate('500ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })))
    ], { optional: true })
  ])
]);

// Pulse animation
export const pulse = trigger('pulse', [
  transition('* => *', [
    animate('500ms ease-in-out', keyframes([
      style({ transform: 'scale(1)', offset: 0 }),
      style({ transform: 'scale(1.05)', offset: 0.5 }),
      style({ transform: 'scale(1)', offset: 1 })
    ]))
  ])
]);

// Slide in out animation
export const slideInOut = trigger('slideInOut', [
  state('in', style({ height: '*', opacity: 1 })),
  transition(':enter', [
    style({ height: 0, opacity: 0 }),
    animate('300ms ease-in-out', style({ height: '*', opacity: 1 }))
  ]),
  transition(':leave', [
    animate('300ms ease-in-out', style({ height: 0, opacity: 0 }))
  ])
]);

// Rotate animation
export const rotate = trigger('rotate', [
  state('default', style({ transform: 'rotate(0)' })),
  state('rotated', style({ transform: 'rotate(180deg)' })),
  transition('default <=> rotated', animate('300ms ease-in-out'))
]);

// Card hover animation
export const cardHover = trigger('cardHover', [
  state('default', style({
    transform: 'translateY(0)',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)'
  })),
  state('hovered', style({
    transform: 'translateY(-5px)',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)'
  })),
  transition('default <=> hovered', animate('300ms ease-in-out'))
]);

// Route animations
export const routeAnimations = trigger('routeAnimations', [
  transition('* <=> *', [
    style({ position: 'relative' }),
    query(':enter, :leave', [
      style({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%'
      })
    ], { optional: true }),
    query(':enter', [
      style({ opacity: 0 })
    ], { optional: true }),
    query(':leave', [
      animate('300ms ease-out', style({ opacity: 0 }))
    ], { optional: true }),
    query(':enter', [
      animate('300ms ease-out', style({ opacity: 1 }))
    ], { optional: true })
  ])
]);

// Bounce animation
export const bounce = trigger('bounce', [
  transition('* => *', [
    animate('500ms ease-in-out', keyframes([
      style({ transform: 'translateY(0)', offset: 0 }),
      style({ transform: 'translateY(-10px)', offset: 0.5 }),
      style({ transform: 'translateY(0)', offset: 1 })
    ]))
  ])
]);

// Shake animation
export const shake = trigger('shake', [
  transition('* => *', [
    animate('500ms ease-in-out', keyframes([
      style({ transform: 'translateX(0)', offset: 0 }),
      style({ transform: 'translateX(-5px)', offset: 0.2 }),
      style({ transform: 'translateX(5px)', offset: 0.4 }),
      style({ transform: 'translateX(-5px)', offset: 0.6 }),
      style({ transform: 'translateX(5px)', offset: 0.8 }),
      style({ transform: 'translateX(0)', offset: 1 })
    ]))
  ])
]);

// Expand collapse animation
export const expandCollapse = trigger('expandCollapse', [
  state('collapsed', style({ height: '0px', overflow: 'hidden' })),
  state('expanded', style({ height: '*', overflow: 'hidden' })),
  transition('collapsed <=> expanded', animate('300ms ease-in-out'))
]); 