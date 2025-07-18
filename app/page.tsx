"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Play, AlertCircle, Settings, Eye, RefreshCw, Database, Code } from "lucide-react"

const initialConfig = {
  config_version: "v1",
  global_settings: {
    card_priorities: {
      active_order_track: 1,
      order_rating_tip: 2,
      market_product_suggestion: 3,
      market_ready_basket_suggestion: 4,
      g10_abandoned_basket: 5,
      g30_abandoned_basket: 6,
      food_abandoned_basket: 7,
      food_product_suggestion: 8,
      food_restaurant_suggestion: 9,
      ne_yesem_entry_point: 10,
      play_and_win: 11,
    },
  },
  use_domain_propensity: {
    enabled: true,
    default_scores: {
      "2": 30,
      "3": 20,
      "4": 10,
      "6": 10,
      "10": 30,
    },
    exclusion_rules: [
      {
        if_card_exists: "market_product_suggestion",
        exclude: ["ne_yesem_entry_point"],
      },
    ],
  },
  cards: [
    {
      card_id: "active_order_track",
      source: "onboarding",
      service_type: [10, 3, 2, 6, 4],
      show_condition: "user.has_active_order == true",
      expire_condition: "user.has_active_order == false",
      hide_on_click: false,
      score: 100,
      domain_propensity_effect: 0.0,
    },
    {
      card_id: "order_rating_tip",
      source: "onboarding",
      service_type: [10, 3, 2, 6, 4],
      show_condition: "has_awaiting_rating.is_exist == true",
      expire_condition: "(has_awaiting_rating.order_date + end_of_next_day) || (has_awaiting_rating == false)",
      hide_on_click: true,
      scores: [
        {
          min_age: { value: 0, unit: "second" },
          max_age: { value: 2, unit: "hour" },
          score: 50,
        },
        {
          min_age: { value: 2, unit: "hour" },
          max_age: { value: 0, unit: "day" },
          score: 25,
        },
        {
          min_age: { value: 1, unit: "day" },
          max_age: { value: 2, unit: "day" },
          score: 10,
        },
      ],
      fallback_score: 0,
      domain_propensity_effect: 0.0,
    },
    {
      card_id: "market_product_suggestion",
      scores: { score_dict_from_SAR_per_daypart: {} },
      max_suggestion_count: 2,
      source: "SAR",
      service_type: [10, 3],
      show_condition: "score > threshold",
      threshold: 40,
      expire_condition: "end_of_daypart",
      hide_on_click: true,
      fallback_score: 0,
      domain_propensity_effect: 0.5,
    },
    {
      card_id: "food_restaurant_suggestion",
      max_suggestion_count: 2,
      source: "SAR",
      service_type: [2],
      show_condition: "score > threshold",
      threshold: 40,
      expire_condition: "end_of_daypart",
      hide_on_click: true,
      domain_propensity_effect: 1,
      fallback_score: 0,
      scores: { score_dict_from_SAR_per_daypart: {} },
    },
    {
      card_id: "ne_yesem_entry_point",
      source: "food_listing",
      service_type: [2],
      show_condition: "food_product_suggestion == false",
      expire_condition: "end_of_daypart",
      hide_on_click: true,
      scores: [
        { start: "08:00", end: "11:00", score: 10 },
        { start: "11:00", end: "13:00", score: 70 },
        { start: "13:00", end: "15:00", score: 20 },
        { start: "15:00", end: "18:00", score: 10 },
        { start: "18:00", end: "19:30", score: 70 },
        { start: "19:30", end: "21:00", score: 30 },
        { start: "21:00", end: "23:00", score: 10 },
        { start: "23:00", end: "08:00", score: 0 },
      ],
      domain_propensity_effect: 0.5,
      fallback_score: 0,
    },
    {
      card_id: "play_and_win",
      source: "onboarding",
      service_type: [10, 3, 2, 6, 4],
      show_condition: "user.available_play_and_win == true",
      expire_condition: "end_of_day",
      hide_on_click: true,
      score: 30,
      domain_propensity_effect: 0.5,
      fallback_score: 0,
    },
  ],
}

const initialRequest = {
  user_id: "567a0a9ffaa8420004948cv6",
  request_time: "2025-07-01T13:00:00Z",
  daypart: "afternoon",
  onboarding: {
    "2": {
      has_active_order: true,
      active_order_time: "2025-06-30T15:00:00Z",
      has_awaiting_rating: false,
      awaiting_rating_time: null,
      user_churn_status: false,
      has_abandoned_basket: true,
      basket_last_updated_time: "2025-07-01T12:40:00Z",
      available_play_and_win: true,
    },
    "3": {
      has_active_order: false,
      active_order_time: null,
      has_awaiting_rating: true,
      awaiting_rating_time: "2025-06-29T10:00:00Z",
      user_churn_status: false,
      has_abandoned_basket: false,
      basket_last_updated_time: null,
      available_play_and_win: false,
    },
    "10": {
      has_active_order: true,
      active_order_time: "2025-06-30T18:00:00Z",
      has_awaiting_rating: true,
      awaiting_rating_time: "2025-06-30T20:00:00Z",
      user_churn_status: true,
      has_abandoned_basket: true,
      basket_last_updated_time: "2025-07-01T11:00:00Z",
      available_play_and_win: false,
    },
  },
  reco_scores: {
    "10": {
      market_product_suggestion: {
        scores: {
          morning: [
            { product_id: "63482183162fad1bc54a22d8", refill_eligible: true, score: 0.8 },
            { product_id: "63482183162fad1bc54a22d9", refill_eligible: false, score: 0.7 },
          ],
          afternoon: [
            { product_id: "63482183162fad1bc54a22d8", refill_eligible: true, score: 0.9 },
            { product_id: "63482183162fad1bc54a22da", refill_eligible: true, score: 0.6 },
          ],
          evening: [
            { product_id: "63482183162fad1bc54a22d8", refill_eligible: false, score: 0.65 },
            { product_id: "63482183162fad1bc54a22db", refill_eligible: false, score: 0.55 },
          ],
        },
      },
    },
    "2": {
      food_restaurant_suggestion: {
        scores: {
          morning: [
            { restaurant_id: "rest_001", score: 0.8 },
            { restaurant_id: "rest_002", score: 0.7 },
          ],
          afternoon: [
            { restaurant_id: "rest_003", score: 0.9 },
            { restaurant_id: "rest_004", score: 0.6 },
          ],
          evening: [
            { restaurant_id: "rest_005", score: 0.65 },
            { restaurant_id: "rest_006", score: 0.55 },
          ],
        },
      },
    },
    "3": {
      market_ready_basket: {
        scores: {
          morning: 0.75,
          afternoon: 0.8,
          evening: 0.6,
          night: 0.55,
        },
      },
    },
  },
}

const serviceTypeNames = {
  2: "Food",
  3: "Grocery",
  4: "Pharmacy",
  6: "Alcohol",
  10: "Market",
}

export default function UberLandingConfig() {
  const [config, setConfig] = useState<any>(initialConfig)
  const [configText, setConfigText] = useState(JSON.stringify(initialConfig, null, 2))
  const [request, setRequest] = useState(initialRequest)
  const [requestText, setRequestText] = useState(JSON.stringify(initialRequest, null, 2))
  const [response, setResponse] = useState<any>({ displayed_cards: [], excluded_cards: [] })
  const [configError, setConfigError] = useState("")
  const [requestError, setRequestError] = useState("")
  const [activeTab, setActiveTab] = useState("edit")
  const [previewTab, setPreviewTab] = useState("cards")
  const [userId, setUserId] = useState("567a0a9ffaa8420004948cv6")
  const [environment, setEnvironment] = useState("dev")

  // Generate initial response on component mount
  useEffect(() => {
    console.log("useEffect triggered - config or request changed")
    generateResponse(config, request)
  }, [config, request])

  const handleConfigChange = (value: string) => {
    setConfigText(value)
    try {
      const parsed = JSON.parse(value)
      setConfig(parsed)
      setConfigError("")
      generateResponse(parsed, request)
    } catch (error) {
      setConfigError("Invalid JSON format")
    }
  }

  const handleRequestChange = (value: string) => {
    setRequestText(value)
    try {
      const parsed = JSON.parse(value)
      setRequest(parsed)
      setRequestError("")
      generateResponse(config, parsed)
    } catch (error) {
      setRequestError("Invalid JSON format")
    }
  }

  const generateResponse = (currentConfig: any, currentRequest: any) => {
    console.log("generateResponse called with:", { currentConfig, currentRequest })
    const displayedCards = []
    const excludedCards = []

    // Get cards sorted by priority
    const priorities = currentConfig.global_settings?.card_priorities || {}
    const sortedCards =
      currentConfig.cards?.sort((a: any, b: any) => {
        const priorityA = priorities[a.card_id] || 999
        const priorityB = priorities[b.card_id] || 999
        return priorityA - priorityB
      }) || []

    // Apply exclusion rules
    const exclusionRules = currentConfig.use_domain_propensity?.exclusion_rules || []
    const excludedCardIds = new Set()

    // Process each card
    sortedCards.forEach((card: any) => {
      if (excludedCardIds.has(card.card_id)) {
        excludedCards.push({ card_id: card.card_id, reason: "exclusion_rule" })
        return
      }

      // Check show conditions
      const serviceTypes = Array.isArray(card.service_type) ? card.service_type : [card.service_type]

      for (const serviceType of serviceTypes) {
        const onboardingData = currentRequest.onboarding?.[serviceType.toString()]
        if (!onboardingData) continue

        // Evaluate show condition
        let shouldShow = false
        if (card.show_condition === "user.has_active_order == true") {
          shouldShow = onboardingData.has_active_order === true
        } else if (card.show_condition === "has_awaiting_rating.is_exist == true") {
          shouldShow = onboardingData.has_awaiting_rating === true
        } else if (card.show_condition === "user.available_play_and_win == true") {
          shouldShow = onboardingData.available_play_and_win === true
        } else if (card.show_condition === "user.has_abononed_basket == true") {
          shouldShow = onboardingData.has_abandoned_basket === true
        } else if (card.show_condition === "score > threshold") {
          shouldShow = true // Will be checked later with actual scores
        } else if (card.show_condition === "food_product_suggestion == false") {
          shouldShow = true // Simplified for demo
        } else if (card.show_condition === "true") {
          shouldShow = true // Always show for testing
        }
        
        console.log(`Card ${card.card_id} for service ${serviceType}: shouldShow=${shouldShow}, show_condition="${card.show_condition}"`)

        if (!shouldShow) continue

        // Calculate base score
        let baseScore = 0
        if (card.source === "SAR") {
          // Get scores from recommendation service
          const recoData = currentRequest.reco_scores?.[serviceType.toString()]?.[card.card_id]
          if (recoData?.scores) {
            const daypartScores = recoData.scores[currentRequest.daypart] || recoData.scores.morning
            if (Array.isArray(daypartScores)) {
              // Handle product/restaurant suggestions
              daypartScores.forEach((item: any, index: number) => {
                if (
                  card.max_suggestion_count &&
                  displayedCards.filter((c) => c.card_id === card.card_id).length >= card.max_suggestion_count
                ) {
                  return
                }

                const itemScore = item.score * 100 // Convert to 0-100 scale
                if (card.threshold && itemScore < card.threshold) return

                // Apply domain propensity formula
                const domainPropensityScore =
                  currentConfig.use_domain_propensity?.default_scores?.[serviceType.toString()] || 0
                const domainPropensityEffect = card.domain_propensity_effect || 0
                const finalScore =
                  (1 - domainPropensityEffect) * itemScore + domainPropensityEffect * (1 + domainPropensityScore)

                // Generate expires_at based on expire_condition
                const expiresAt = new Date()
                if (card.expire_condition === "end_of_daypart") {
                  expiresAt.setHours(18, 0, 0, 0) // End of current daypart
                } else if (card.expire_condition === "end_of_day") {
                  expiresAt.setHours(23, 59, 59, 999)
                }

                displayedCards.push({
                  card_id: card.card_id,
                  service_type: serviceType,
                  display_order: displayedCards.length,
                  base_score: Math.round(itemScore * 100) / 100,
                  domain_propensity_score: domainPropensityScore,
                  domain_propensity_effect: domainPropensityEffect,
                  final_score: Math.round(finalScore * 100) / 100,
                  expires_at: expiresAt.toISOString(),
                  product_id: item.product_id,
                  restaurant_id: item.restaurant_id,
                  refill_eligible: item.refill_eligible,
                  dismiss_behavior: {
                    hide_on_click: card.hide_on_click,
                    expire_condition: card.expire_condition,
                  },
                })
              })
            } else if (typeof daypartScores === "number") {
              // Handle single score items
              const itemScore = daypartScores * 100
              if (card.threshold && itemScore < card.threshold) return

              const domainPropensityScore =
                currentConfig.use_domain_propensity?.default_scores?.[serviceType.toString()] || 0
              const domainPropensityEffect = card.domain_propensity_effect || 0
              const finalScore =
                (1 - domainPropensityEffect) * itemScore + domainPropensityEffect * (1 + domainPropensityScore)

              const expiresAt = new Date()
              if (card.expire_condition === "end_of_daypart") {
                expiresAt.setHours(18, 0, 0, 0)
              } else if (card.expire_condition === "end_of_day") {
                expiresAt.setHours(23, 59, 59, 999)
              }

              displayedCards.push({
                card_id: card.card_id,
                service_type: serviceType,
                display_order: displayedCards.length,
                base_score: Math.round(itemScore * 100) / 100,
                domain_propensity_score: domainPropensityScore,
                domain_propensity_effect: domainPropensityEffect,
                final_score: Math.round(finalScore * 100) / 100,
                expires_at: expiresAt.toISOString(),
                dismiss_behavior: {
                  hide_on_click: card.hide_on_click,
                  expire_condition: card.expire_condition,
                },
              })
            }
          }
        } else {
          // Handle onboarding cards with static or time-based scores
          if (typeof card.score === "number") {
            baseScore = card.score
          } else if (Array.isArray(card.scores)) {
            // Time-based scoring (for rating tips, abandoned baskets, etc.)
            baseScore = card.scores[0]?.score || card.fallback_score || 0
          } else if (Array.isArray(card.scores) && card.scores[0]?.start) {
            // Time-of-day scoring (for ne_yesem_entry_point)
            const currentHour = new Date().getHours()
            const timeScore = card.scores.find((s: any) => {
              const start = Number.parseInt(s.start.split(":")[0])
              const end = Number.parseInt(s.end.split(":")[0])
              return currentHour >= start && currentHour < end
            })
            baseScore = timeScore?.score || card.fallback_score || 0
          }

          const domainPropensityScore =
            currentConfig.use_domain_propensity?.default_scores?.[serviceType.toString()] || 0
          const domainPropensityEffect = card.domain_propensity_effect || 0
          const finalScore =
            (1 - domainPropensityEffect) * baseScore + domainPropensityEffect * (1 + domainPropensityScore)

          const expiresAt = new Date()
          if (card.expire_condition === "end_of_daypart") {
            expiresAt.setHours(18, 0, 0, 0)
          } else if (card.expire_condition === "end_of_day") {
            expiresAt.setHours(23, 59, 59, 999)
          } else if (card.expire_condition === "user.has_active_order == false") {
            expiresAt.setTime(expiresAt.getTime() + 24 * 60 * 60 * 1000) // 24 hours from now
          }

          const newCard = {
            card_id: card.card_id,
            service_type: serviceType,
            display_order: displayedCards.length,
            base_score: baseScore,
            domain_propensity_score: domainPropensityScore,
            domain_propensity_effect: domainPropensityEffect,
            final_score: Math.round(finalScore * 100) / 100,
            expires_at: expiresAt.toISOString(),
            dismiss_behavior: {
              hide_on_click: card.hide_on_click,
              expire_condition: card.expire_condition,
            },
          }
          console.log(`Adding card to displayedCards:`, newCard)
          displayedCards.push(newCard)
        }
      }

      // Apply exclusion rules after processing
      exclusionRules.forEach((rule: any) => {
        if (displayedCards.some((c) => c.card_id === rule.if_card_exists)) {
          rule.exclude?.forEach((excludeId: string) => {
            excludedCardIds.add(excludeId)
          })
        }
      })
    })

    // Sort by final score descending
    displayedCards.sort((a, b) => b.final_score - a.final_score)
    displayedCards.forEach((card, index) => {
      card.display_order = index
    })

    const newResponse = {
      user_id: userId,
      environment: environment,
      response_time: new Date().toISOString(),
      daypart: currentRequest.daypart,
      displayed_cards: displayedCards.slice(0, 5),
      excluded_cards: excludedCards,
    }
    console.log("Setting response:", newResponse)
    setResponse(newResponse)
  }

  const formatScore = (score: number) => {
    if (score >= 1) return score.toString()
    return score.toFixed(2)
  }

  const getCardTypeColor = (cardId: string) => {
    if (cardId.includes("active_order")) return "bg-green-100 text-green-800"
    if (cardId.includes("rating")) return "bg-blue-100 text-blue-800"
    if (cardId.includes("market")) return "bg-purple-100 text-purple-800"
    if (cardId.includes("food")) return "bg-orange-100 text-orange-800"
    if (cardId.includes("abandoned")) return "bg-red-100 text-red-800"
    if (cardId.includes("play")) return "bg-yellow-100 text-yellow-800"
    return "bg-gray-100 text-gray-800"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="">
        <div className="mb-4 py-4 border-b bg-white">
          <div className="container">
            <h1 className="text-2xl font-bold text-gray-900">Landing Page Configuration</h1>
            <p className="text-gray-600">Manage rules and upstream data to preview personalized cards</p>
          </div>
        </div>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label htmlFor="environment" className="text-sm font-medium text-gray-700">
                  Environment:
                </label>
                <select
                  id="environment"
                  value={environment}
                  onChange={(e) => {
                    setEnvironment(e.target.value)
                    generateResponse(config, request)
                  }}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white"
                >
                  <option value="dev">Development</option>
                  <option value="prod">Production</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="userId" className="text-sm font-medium text-gray-700">
                  User ID:
                </label>
                <input
                  id="userId"
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-mono w-48"
                  placeholder="Enter user ID"
                />
              </div>
              <Badge
                variant="outline"
                className={`${environment === "prod" ? "bg-red-50 text-red-700 border-red-200" : "bg-green-50 text-green-700 border-green-200"}`}
              >
                {environment === "prod" ? "PROD" : "DEV"} - Config v{config.config_version}
              </Badge>
              <Button variant="outline" size="sm" onClick={() => generateResponse(config, request)}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Preview
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    const deleteUrl =
                      environment === "prod"
                        ? `https://api.uber.com/prod/landing-page/users/${userId}/click-data`
                        : `https://api-dev.uber.com/dev/landing-page/users/${userId}/click-data`

                    if (
                      window.confirm(
                        `Are you sure you want to delete all click data for user ${userId} in ${environment.toUpperCase()} environment?`,
                      )
                    ) {
                      // In a real implementation, this would make an API call
                      fetch(deleteUrl, { method: "DELETE" })
                        .then(() => {
                          alert(`Click data deleted for user ${userId} in ${environment.toUpperCase()}`)
                        })
                        .catch((error) => {
                          alert(`Failed to delete click data: ${error.message}`)
                        })
                    }
                  }}
                >
                  Clear Click Data
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newRelicUrl =
                      environment === "prod"
                        ? `https://one.newrelic.com/logger?account=PROD_ACCOUNT_ID&query=user_id:"${userId}" AND service:"landing-page" AND event_type:"card_click"`
                        : `https://one.newrelic.com/logger?account=DEV_ACCOUNT_ID&query=user_id:"${userId}" AND service:"landing-page" AND event_type:"card_click"`

                    window.open(newRelicUrl, "_blank")
                  }}
                >
                  View Logs
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
          {/* Configuration Panel */}
          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                <CardTitle>Configuration & Data</CardTitle>
              </div>
              <CardDescription>Edit configuration rules and upstream service responses</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="edit" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Edit Rules
                  </TabsTrigger>
                  <TabsTrigger value="config" className="flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Config Rules
                  </TabsTrigger>
                  <TabsTrigger value="request" className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Response Data
                  </TabsTrigger>
                </TabsList>

                {activeTab === 'edit' &&
                  <TabsContent value="edit" className="flex-1 flex flex-col">
                    {/* Kart editör formu burada */}
                    <div className="flex flex-col gap-4 flex-1 overflow-auto">
                      {config.cards.map((card, idx) => (
                        <Card key={card.card_id + idx} className="p-4">
                          <div className="flex flex-col gap-2">
                            <div className="flex gap-2 items-center">
                              <label className="w-32 text-sm font-medium">Card ID</label>
                              <input
                                className="border rounded px-2 py-1 flex-1"
                                value={card.card_id}
                                onChange={e => {
                                  const newCards = [...config.cards]
                                  newCards[idx] = { ...card, card_id: e.target.value }
                                  const newConfig = { ...config, cards: newCards }
                                  setConfig(newConfig)
                                  setConfigText(JSON.stringify(newConfig, null, 2))
                                  generateResponse(newConfig, request)
                                }}
                              />
                              <Button variant="destructive" size="sm" onClick={() => {
                                const newConfig = { ...config, cards: config.cards.filter((_, i) => i !== idx) }
                                setConfig(newConfig)
                                setConfigText(JSON.stringify(newConfig, null, 2))
                                generateResponse(newConfig, request)
                              }}>Sil</Button>
                            </div>
                            <div className="flex gap-2 items-center">
                              <label className="w-32 text-sm font-medium">Source</label>
                              <input
                                className="border rounded px-2 py-1 flex-1"
                                value={card.source ?? ''}
                                onChange={e => {
                                  const newCards = [...config.cards]
                                  newCards[idx] = { ...card, source: e.target.value }
                                  const newConfig = { ...config, cards: newCards }
                                  setConfig(newConfig)
                                  setConfigText(JSON.stringify(newConfig, null, 2))
                                  generateResponse(newConfig, request)
                                }}
                              />
                            </div>
                            <div className="flex gap-2 items-center">
                              <label className="w-32 text-sm font-medium">Show Condition</label>
                              <input
                                className="border rounded px-2 py-1 flex-1"
                                value={card.show_condition ?? ''}
                                onChange={e => {
                                  const newCards = [...config.cards]
                                  newCards[idx] = { ...card, show_condition: e.target.value }
                                  const newConfig = { ...config, cards: newCards }
                                  setConfig(newConfig)
                                  setConfigText(JSON.stringify(newConfig, null, 2))
                                  generateResponse(newConfig, request)
                                }}
                              />
                            </div>
                            <div className="flex gap-2 items-center">
                              <label className="w-32 text-sm font-medium">Expire Condition</label>
                              <input
                                className="border rounded px-2 py-1 flex-1"
                                value={card.expire_condition ?? ''}
                                onChange={e => {
                                  const newCards = [...config.cards]
                                  newCards[idx] = { ...card, expire_condition: e.target.value }
                                  const newConfig = { ...config, cards: newCards }
                                  setConfig(newConfig)
                                  setConfigText(JSON.stringify(newConfig, null, 2))
                                  generateResponse(newConfig, request)
                                }}
                              />
                            </div>
                            <div className="flex gap-2 items-center">
                              <label className="w-32 text-sm font-medium">Hide on Click</label>
                              <input
                                type="checkbox"
                                checked={!!card.hide_on_click}
                                onChange={e => {
                                  const newCards = [...config.cards]
                                  newCards[idx] = { ...card, hide_on_click: e.target.checked }
                                  const newConfig = { ...config, cards: newCards }
                                  setConfig(newConfig)
                                  setConfigText(JSON.stringify(newConfig, null, 2))
                                  generateResponse(newConfig, request)
                                }}
                              />
                            </div>
                            <div className="flex gap-2 items-center">
                              <label className="w-32 text-sm font-medium">Score</label>
                              <input
                                type="range"
                                min={0}
                                max={100}
                                value={card.score ?? 0}
                                onChange={e => {
                                  const newCards = [...config.cards]
                                  newCards[idx] = { ...card, score: Number(e.target.value) }
                                  const newConfig = { ...config, cards: newCards }
                                  setConfig(newConfig)
                                  setConfigText(JSON.stringify(newConfig, null, 2))
                                  generateResponse(newConfig, request)
                                }}
                                className="flex-1"
                              />
                              <span className="w-10 text-right">{card.score ?? 0}</span>
                            </div>
                            <div className="flex gap-2 items-center">
                              <label className="w-32 text-sm font-medium">Domain Propensity Effect</label>
                              <input
                                type="range"
                                min={0}
                                max={1}
                                step={0.01}
                                value={card.domain_propensity_effect ?? 0}
                                onChange={e => {
                                  const newCards = [...config.cards]
                                  newCards[idx] = { ...card, domain_propensity_effect: Number(e.target.value) }
                                  const newConfig = { ...config, cards: newCards }
                                  setConfig(newConfig)
                                  setConfigText(JSON.stringify(newConfig, null, 2))
                                  generateResponse(newConfig, request)
                                }}
                                className="flex-1"
                              />
                              <span className="w-10 text-right">{card.domain_propensity_effect ?? 0}</span>
                            </div>
                            {/* Diğer alanlar için de benzer inputlar eklenebilir */}
                          </div>
                        </Card>
                      ))}
                      <Button className="mt-2 w-fit" onClick={() => {
                        console.log("Adding new card...")
                        const newCard = {
                          card_id: "new_card_" + (config.cards.length + 1),
                          source: "onboarding",
                          service_type: [10],
                          show_condition: "true",
                          expire_condition: "end_of_day",
                          hide_on_click: false,
                          score: 90,
                          domain_propensity_effect: 0,
                        }
                        const newConfig = { ...config, cards: [...config.cards, newCard] }
                        console.log("New config:", newConfig)
                        setConfig(newConfig)
                        setConfigText(JSON.stringify(newConfig, null, 2))
                        generateResponse(newConfig, request)
                      }}>+ Add Kart</Button>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <div className="text-sm text-gray-500">{config.cards?.length || 0} cards configured</div>
                      <Button size="sm" onClick={() => setConfigText(JSON.stringify(config, null, 2))}>
                        <Play className="h-4 w-4 mr-2" />
                        Format JSON
                      </Button>
                    </div>
                  </TabsContent>
                }

                {activeTab === 'config' &&
                  <TabsContent value="config" className="flex-1 flex flex-col">
                    {configError && (
                      <Alert className="mb-4 border-red-200 bg-red-50">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">{configError}</AlertDescription>
                      </Alert>
                    )}
                    <Textarea
                      value={configText}
                      onChange={(e) => handleConfigChange(e.target.value)}
                      className="flex-1 font-mono text-sm resize-none"
                      placeholder="Enter configuration JSON..."
                    />
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <div className="text-sm text-gray-500">{config.cards?.length || 0} cards configured</div>
                      <Button size="sm" onClick={() => setConfigText(JSON.stringify(config, null, 2))}>
                        <Play className="h-4 w-4 mr-2" />
                        Format JSON
                      </Button>
                    </div>
                  </TabsContent>
                }

                {
                  activeTab === 'request' &&
                  <TabsContent value="request" className="flex-1 flex flex-col">
                    {/* Request Data tabı aynı kalsın */}
                    {requestError && (
                      <Alert className="mb-4 border-red-200 bg-red-50">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">{requestError}</AlertDescription>
                      </Alert>
                    )}
                    <Textarea
                      value={requestText}
                      onChange={(e) => handleRequestChange(e.target.value)}
                      className="flex-1 font-mono text-sm resize-none"
                      placeholder="Enter upstream service response JSON..."
                    />
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <div className="text-sm text-gray-500">
                        User: {request.user_id?.substring(0, 8)}... | Daypart: {request.daypart}
                      </div>
                      <Button size="sm" onClick={() => setRequestText(JSON.stringify(request, null, 2))}>
                        <Play className="h-4 w-4 mr-2" />
                        Format JSON
                      </Button>
                    </div>
                  </TabsContent>
                }

              </Tabs>
            </CardContent>
          </Card>

          {/* Preview Panel */}
          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                <CardTitle>Final Ranking Output</CardTitle>
              </div>
              <CardDescription>
                Live preview of personalized cards based on configuration and data ({environment.toUpperCase()}{" "}
                environment)
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <Tabs value={previewTab} onValueChange={setPreviewTab} className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="cards">Displayed Cards</TabsTrigger>
                  <TabsTrigger value="response">Raw Response</TabsTrigger>
                </TabsList>

                <TabsContent value="cards" className="flex-1">
                  <ScrollArea className="h-full">
                    <div className="space-y-4">
                      {response.displayed_cards.map((card, index) => (
                        <Card key={`${card.card_id}-${index}`} className="border-l-4 border-l-blue-500">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Badge className={getCardTypeColor(card.card_id)}>
                                  {card.card_id.replace(/_/g, " ")}
                                </Badge>
                                <Badge variant="outline">#{card.display_order + 1}</Badge>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-semibold text-gray-900">
                                  {formatScore(card.final_score)}
                                </div>
                                <div className="text-xs text-gray-500">Final Score</div>
                                <div className="text-xs text-gray-400 mt-1">
                                  Base: {formatScore(card.base_score)}
                                  {card.domain_propensity_effect > 0 && (
                                    <div>
                                      DP: {card.domain_propensity_score} × {card.domain_propensity_effect}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <div className="text-gray-500">Service Type</div>
                                <div className="font-medium">
                                  {serviceTypeNames[card.service_type as keyof typeof serviceTypeNames] ||
                                    card.service_type}
                                </div>
                              </div>
                              <div>
                                <div className="text-gray-500">Expires At</div>
                                <div className="text-xs font-mono">{new Date(card.expires_at).toLocaleString()}</div>
                              </div>
                              {card.product_id && (
                                <div>
                                  <div className="text-gray-500">Product ID</div>
                                  <div className="font-mono text-xs">{card.product_id.substring(0, 12)}...</div>
                                </div>
                              )}
                              {card.restaurant_id && (
                                <div>
                                  <div className="text-gray-500">Restaurant ID</div>
                                  <div className="font-mono text-xs">{card.restaurant_id}</div>
                                </div>
                              )}
                              {card.refill_eligible !== undefined && (
                                <div>
                                  <div className="text-gray-500">Refill Eligible</div>
                                  <div className={card.refill_eligible ? "text-green-600" : "text-gray-600"}>
                                    {card.refill_eligible ? "Yes" : "No"}
                                  </div>
                                </div>
                              )}
                              <div>
                                <div className="text-gray-500">Hide on Click</div>
                                <div
                                  className={card.dismiss_behavior.hide_on_click ? "text-orange-600" : "text-gray-600"}
                                >
                                  {card.dismiss_behavior.hide_on_click ? "Yes" : "No"}
                                </div>
                              </div>
                            </div>

                            <Separator className="my-3" />
                            <div className="text-xs text-gray-500">
                              <strong>Expire:</strong> {card.dismiss_behavior.expire_condition}
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      {response.excluded_cards.length > 0 && (
                        <>
                          <Separator className="my-4" />
                          <div className="text-sm font-medium text-gray-700 mb-2">Excluded Cards</div>
                          {response.excluded_cards.map((card, index) => (
                            <Card key={index} className="border-l-4 border-l-red-500 bg-red-50">
                              <CardContent className="p-3">
                                <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                                  {card.card_id.replace(/_/g, " ")}
                                </Badge>
                                <div className="text-xs text-red-600 mt-1">
                                  Excluded: {card.reason || "configuration rules"}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </>
                      )}

                      {response.displayed_cards.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                          <p>No cards match the current configuration and data</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="response" className="flex-1">
                  <ScrollArea className="h-full">
                    <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-auto">
                      {JSON.stringify(response, null, 2)}
                    </pre>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
