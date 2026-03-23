// Mock data for Salla, Airtable, and business metrics
// These are placeholder shapes matching the real API contract

export const mockBusiness = {
  salla: {
    ordersToday: 47,
    revenueToday: 18_420,
    revenueMTD: 284_560,
    revenueTarget: 400_000,
    orders: {
      pending: 12,
      fulfilled: 31,
      returned: 4,
      cancelled: 2,
    },
    ordersTrend: [
      { date: '03-17', orders: 38, revenue: 14200 },
      { date: '03-18', orders: 42, revenue: 16800 },
      { date: '03-19', orders: 35, revenue: 13500 },
      { date: '03-20', orders: 51, revenue: 19200 },
      { date: '03-21', orders: 44, revenue: 17100 },
      { date: '03-22', orders: 49, revenue: 18900 },
      { date: '03-23', orders: 47, revenue: 18420 },
    ],
  },
  products: [
    { sku: 'ALM-001', name: 'Wireless Charger Pro', sold: 124, revenue: 43_400, trend: [8,12,9,15,14,11,13], status: 'hot' },
    { sku: 'ALM-002', name: 'Smart Watch Band', sold: 89, revenue: 17_800, trend: [6,8,7,9,8,10,11], status: 'growing' },
    { sku: 'ALM-003', name: 'Laptop Stand Adjustable', sold: 67, revenue: 26_800, trend: [10,9,8,7,8,7,6], status: 'declining' },
    { sku: 'ALM-004', name: 'USB-C Hub 7-in-1', sold: 203, revenue: 71_050, trend: [24,28,29,31,30,29,32], status: 'hot' },
    { sku: 'ALM-005', name: 'Phone Case Premium', sold: 45, revenue: 6_750, trend: [8,7,6,5,6,5,4], status: 'declining' },
    { sku: 'ALM-006', name: 'Desk Organizer', sold: 31, revenue: 7_750, trend: [4,4,3,5,4,3,5], status: 'stable' },
  ],
  customer: {
    avgRating: 4.6,
    totalReviews: 1_247,
    recentReviews: [
      { id: 1, rating: 5, text: 'Excellent quality, fast delivery!', product: 'USB-C Hub', date: '2026-03-23' },
      { id: 2, rating: 4, text: 'Good product but packaging was damaged', product: 'Wireless Charger', date: '2026-03-23' },
      { id: 3, rating: 5, text: 'Perfect fit for my MacBook', product: 'Laptop Stand', date: '2026-03-22' },
    ],
    supportTickets: 8,
    returnRate: 3.2,
    satisfactionTrend: [4.4, 4.5, 4.3, 4.6, 4.7, 4.5, 4.6],
  },
  financial: {
    cashPosition: 124_500,
    burnRateMonthly: 38_200,
    grossMargin: 42.8,
    netMargin: 18.4,
    runwayMonths: 3.3,
    cashTrend: [
      { month: 'Sep', cash: 95000 },
      { month: 'Oct', cash: 108000 },
      { month: 'Nov', cash: 98000 },
      { month: 'Dec', cash: 142000 },
      { month: 'Jan', cash: 118000 },
      { month: 'Feb', cash: 131000 },
      { month: 'Mar', cash: 124500 },
    ],
  },
  blockers: [
    { id: 1, severity: 'critical', title: 'Salla coupon SAVE20 expired — 3 carts abandoned', since: '2026-03-23T08:00:00Z', owner: 'CMO' },
    { id: 2, severity: 'high', title: 'ALM-004 stock critically low (12 units remaining)', since: '2026-03-22T14:00:00Z', owner: 'COO' },
    { id: 3, severity: 'medium', title: 'Product images for ALM-007 pending upload', since: '2026-03-21T10:00:00Z', owner: 'CMO' },
    { id: 4, severity: 'low', title: 'Shipping carrier price update not reflected in checkout', since: '2026-03-20T12:00:00Z', owner: 'CTO' },
  ],
}

export const mockOKRs = [
  {
    id: 'okr-1',
    title: 'Reach 8 Chiefs live',
    description: 'North Star: full executive team running autonomously',
    current: 3,
    target: 8,
    unit: 'chiefs',
    status: 'in_progress',
  },
  {
    id: 'okr-2',
    title: 'Monthly Revenue SAR 400K',
    description: 'Break SAR 400K GMV in a single month',
    current: 284_560,
    target: 400_000,
    unit: 'SAR',
    status: 'in_progress',
  },
  {
    id: 'okr-3',
    title: '1,000 five-star reviews',
    description: 'Build brand trust via customer satisfaction',
    current: 1_247,
    target: 1_000,
    unit: 'reviews',
    status: 'done',
  },
  {
    id: 'okr-4',
    title: 'Zero human middleware tasks',
    description: 'All routine tasks handled by agents without Moe touching them',
    current: 72,
    target: 100,
    unit: '%',
    status: 'in_progress',
  },
]
