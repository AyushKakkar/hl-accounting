// Product catalog — sourced from https://ayushkakkar.github.io/Hl-price-cal/
// Tiers: mrp (no discount), d15, d25, d35, d42, d50
const PRODUCTS = [
    { id: 1, name: "FORMULA 1 SHAKES MIX-500g", volPoint: 21.75, mrp: 2179, d15: 1899, d25: 1713, d35: 1526, d42: 1396, d50: 1246 },
    { id: 2, name: "FORMULA 1 SHAKES MIX 750g", volPoint: 32.65, mrp: 3227, d15: 2813, d25: 2537, d35: 2261, d42: 2068, d50: 1847 },
    { id: 3, name: "PERSONALIZED PROTEIN POWDER 200g", volPoint: 11.5, mrp: 1295, d15: 1129, d25: 1018, d35: 907, d42: 830, d50: 741 },
    { id: 4, name: "PERSONALIZED PROTEIN POWDER 400g", volPoint: 22.5, mrp: 2485, d15: 2166, d25: 1953, d35: 1741, d42: 1592, d50: 1422 },
    { id: 5, name: "SHAKEMATE", volPoint: 6.45, mrp: 653, d15: 604, d25: 572, d35: 540, d42: 517, d50: 491 },
    { id: 6, name: "Male Factor+", volPoint: 34.75, mrp: 3410, d15: 2972, d25: 2681, d35: 2389, d42: 2185, d50: 1952 },
    { id: 7, name: "WOMEN CHOICE", volPoint: 12.45, mrp: 1245, d15: 1085, d25: 978, d35: 872, d42: 798, d50: 712 },
    { id: 8, name: "VRITILIFE BRAIN HEALTH", volPoint: 15.1, mrp: 1464, d15: 1276, d25: 1151, d35: 1026, d42: 938, d50: 838 },
    { id: 9, name: "VRITILIFE IMMUNE HEALTH", volPoint: 15.8, mrp: 1528, d15: 1332, d25: 1201, d35: 1070, d42: 979, d50: 874 },
    { id: 10, name: "VRITILIFE TRIPHALA", volPoint: 11.25, mrp: 1089, d15: 949, d25: 856, d35: 763, d42: 698, d50: 623 },
    { id: 11, name: "VRITILIFE Facial Cleanser", volPoint: 10.4, mrp: 1165, d15: 1015, d25: 916, d35: 816, d42: 746, d50: 667 },
    { id: 12, name: "VRITILIFE Facial Toner", volPoint: 11.8, mrp: 1322, d15: 1152, d25: 1039, d35: 926, d42: 847, d50: 756 },
    { id: 13, name: "VRITILIFE Facial Serum", volPoint: 27.05, mrp: 3022, d15: 2634, d25: 2376, d35: 2118, d42: 1937, d50: 1730 },
    { id: 14, name: "VRITILIFE Moisturizer", volPoint: 13.15, mrp: 1473, d15: 1284, d25: 1158, d35: 1032, d42: 944, d50: 843 },
    { id: 15, name: "AFRESH", volPoint: 7.8, mrp: 812, d15: 707, d25: 638, d35: 568, d42: 520, d50: 464 },
    { id: 16, name: "AFRESH TULSI", volPoint: 7.8, mrp: 812, d15: 712, d25: 646, d35: 580, d42: 534, d50: 481 },
    { id: 17, name: "H24 HYDRATE", volPoint: 14.05, mrp: 1636, d15: 1457, d25: 1338, d35: 1219, d42: 1136, d50: 1041 },
    { id: 18, name: "H24 REBUILD STRENGTH", volPoint: 24.7, mrp: 2616, d15: 2295, d25: 2081, d35: 1868, d42: 1718, d50: 1547 },
    { id: 19, name: "HN SKIN BOOSTER 10gm x 30 Sachets", volPoint: 38.65, mrp: 3910, d15: 3476, d25: 3188, d35: 2899, d42: 2697, d50: 2466 },
    { id: 20, name: "HN SKIN BOOSTER Canister", volPoint: 38.65, mrp: 3910, d15: 3460, d25: 3161, d35: 2862, d42: 2653, d50: 2413 },
    { id: 21, name: "DINO SHAKE", volPoint: 9.6, mrp: 1115, d15: 971, d25: 876, d35: 780, d42: 714, d50: 637 },
    { id: 22, name: "ACTIVATED FIBER TABLETS", volPoint: 15.75, mrp: 1636, d15: 1426, d25: 1286, d35: 1146, d42: 1048, d50: 936 },
    { id: 23, name: "ACTIVATE FIBER COMPLEX", volPoint: 22.95, mrp: 2559, d15: 2231, d25: 2012, d35: 1793, d42: 1640, d50: 1465 },
    { id: 24, name: "ALOE PLUS", volPoint: 9.4, mrp: 1059, d15: 922, d25: 832, d35: 741, d42: 678, d50: 605 },
    { id: 25, name: "ALOE CONCENTRATE", volPoint: 24.95, mrp: 2696, d15: 2350, d25: 2119, d35: 1889, d42: 1727, d50: 1543 },
    { id: 26, name: "SIMPLY PROBIOTIC", volPoint: 21.95, mrp: 2209, d15: 1925, d25: 1736, d35: 1547, d42: 1415, d50: 1264 },
    { id: 27, name: "HERBALIFE CALCIUM TABLETS", volPoint: 10.25, mrp: 1203, d15: 1048, d25: 945, d35: 842, d42: 771, d50: 688 },
    { id: 28, name: "JOINT SUPPORT", volPoint: 20.9, mrp: 2455, d15: 2140, d25: 1930, d35: 1720, d42: 1573, d50: 1405 },
    { id: 29, name: "HERBALIFE NITEWORKS", volPoint: 75, mrp: 7128, d15: 6213, d25: 5604, d35: 4994, d42: 4568, d50: 4080 },
    { id: 30, name: "HERBALIFELINE", volPoint: 25.75, mrp: 2667, d15: 2325, d25: 2097, d35: 1869, d42: 1709, d50: 1527 },
    { id: 31, name: "BETA HEART-VANILLA FLAVOUR", volPoint: 19.55, mrp: 2242, d15: 1994, d25: 1828, d35: 1663, d42: 1547, d50: 1414 },
    { id: 32, name: "MULIVITAMIN", volPoint: 19.95, mrp: 2004, d15: 1746, d25: 1575, d35: 1404, d42: 1284, d50: 1147 },
    { id: 33, name: "CELL ACTIVATOR", volPoint: 21.95, mrp: 2215, d15: 1930, d25: 1741, d35: 1551, d42: 1419, d50: 1267 },
    { id: 34, name: "CELL-U-LOSS", volPoint: 15.75, mrp: 1705, d15: 1486, d25: 1340, d35: 1194, d42: 1092, d50: 975 },
    { id: 35, name: "HERBAL CONTROL", volPoint: 32.95, mrp: 3433, d15: 2992, d25: 2699, d35: 2405, d42: 2199, d50: 1965 },
    { id: 36, name: "OCULAR DEFENSE", volPoint: 19.25, mrp: 1927, d15: 1679, d25: 1515, d35: 1350, d42: 1234, d50: 1103 },
    { id: 37, name: "SLEEP ENHANCE", volPoint: 16.3, mrp: 1697, d15: 1479, d25: 1334, d35: 1189, d42: 1087, d50: 971 },
    { id: 38, name: "LIFTOFF WATERMELON (30 SACHETS)", volPoint: 38.05, mrp: 4119, d15: 3590, d25: 3238, d35: 2886, d42: 2639, d50: 2357 },
    { id: 39, name: "LIFTOFF WATERMELON (10 SACHETS)", volPoint: 12.95, mrp: 1401, d15: 1221, d25: 1101, d35: 982, d42: 898, d50: 802 }
];

const TIERS = [
    { key: 'mrp', label: 'MRP (No discount)' },
    { key: 'd15', label: '15% off' },
    { key: 'd25', label: '25% off' },
    { key: 'd35', label: '35% off' },
    { key: 'd42', label: '42% off' },
    { key: 'd50', label: '50% off' }
];

const DELIVERY_CHARGE = 105;
const FREE_DELIVERY_VP = 100;
