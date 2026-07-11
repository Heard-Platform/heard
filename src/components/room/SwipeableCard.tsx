import { useEffect } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "motion/react";
import type { Card, DebateRoom } from "../../types";
import { getPastelColor } from "../../utils/colors";
import { useSuperCharge } from "../../hooks/useSuperCharge";
import { ChanceCard } from "./ChanceCard";
import { CoverCard } from "./CoverCard";
import { DemographicsCard } from "./DemographicsCard";
import { StatementCard } from "./StatementCard";
import { CertifyCard } from "./CertifyCard";

interface SwipeableCardProps {
  card: Card;
  room: DebateRoom;
  index: number;
  isTopCard: boolean;
  direction: "left" | "right" | "down" | "up" | null;
  isSuperExit: boolean;
  superChargeEnabled: boolean;
  currentIndex: number;
  totalStatements: number;
  allowAnonymous: boolean;
  isAnonymous: boolean;
  getTypeIcon: (type?: string) => string | null;
  onDragEnd: (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => void;
  onSubmitStatement: (text: string) => Promise<void>;
  onShowAccountSetupModal: (featureText: string) => void;
  onDemographicsAnswer?: (id: string, answer: string | null) => void;
  onCertifySuccess: () => void;
  onChargingChange: (charging: boolean) => void;
  onSuperAgree: () => void;
  onSuperDisagree: () => void;
  onSkip: () => void;
  onFlag: () => void;
}

export function SwipeableCard({
  card,
  room,
  index,
  isTopCard,
  direction,
  isSuperExit,
  superChargeEnabled,
  currentIndex,
  totalStatements,
  allowAnonymous,
  isAnonymous,
  getTypeIcon,
  onDragEnd,
  onSubmitStatement,
  onShowAccountSetupModal,
  onDemographicsAnswer,
  onCertifySuccess,
  onChargingChange,
  onSuperAgree,
  onSuperDisagree,
  onSkip,
  onFlag,
}: SwipeableCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const cardOpacity = useTransform(
    x,
    [-200, -100, 0, 100, 200],
    [0, 1, 1, 1, 0],
  );

  const disagreeOpacity = useTransform(x, [-100, 0], [1, 0]);
  const agreeOpacity = useTransform(x, [0, 100], [0, 1]);
  const passOpacity = useTransform(y, [0, 100], [0, 1]);

  const isChargeable =
    isTopCard && card.type === "statement" && superChargeEnabled;

  const {
    charge,
    chargeVisible,
    chargeSide,
    armed,
    handleDragStart,
    handleDragEnd: handleInternalDragEnd,
  } = useSuperCharge({
    x,
    isTopCard,
    isChargeable,
    onSuperAgree,
    onSuperDisagree,
    onDragEnd,
  });

  useEffect(() => {
    if (isTopCard) {
      x.set(0);
      y.set(0);
    }
  }, [isTopCard, x, y]);

  useEffect(() => {
    onChargingChange(chargeVisible);
  }, [chargeVisible, onChargingChange]);

  const getExitAnimation = () => {
    if (!direction) return {};

    const magnitude = isSuperExit ? 640 : 500;
    const spin = isSuperExit ? 60 : 45;

    switch (direction) {
      case "left":
        return { x: -magnitude, rotate: -spin, opacity: 0 };
      case "right":
        return { x: magnitude, rotate: spin, opacity: 0 };
      case "up":
        return { y: -500, opacity: 0, scale: 1.1 };
      case "down":
        return { y: 500, opacity: 0 };
      default:
        return {};
    }
  };

  return (
    <motion.div
      className={isTopCard ? "relative w-full" : "absolute top-0 left-0 w-full"}
      style={{
        x: isTopCard ? x : 0,
        y: isTopCard ? y : 0,
        rotate: isTopCard ? rotate : 0,
        opacity: isTopCard ? cardOpacity : 1 - index * 0.2,
        zIndex: 10 - index,
        scale: 1 - index * 0.05,
        pointerEvents: isTopCard ? "auto" : "none",
        touchAction: isTopCard ? "none" : "auto",
      }}
      drag={isTopCard ? "x" : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={1}
      onDragStart={isTopCard ? handleDragStart : undefined}
      onDragEnd={isTopCard ? handleInternalDragEnd : undefined}
      animate={
        isTopCard && direction
          ? getExitAnimation()
          : {
              scale: 1 - index * 0.05,
              y: index * 10,
            }
      }
      transition={{
        scale: { duration: 0.2 },
        y: { duration: 0.2 },
        opacity: { duration: 0.5 },
        x: { duration: 0.5 },
        rotate: { duration: 0.5 },
      }}
    >
      <div
        className={`${
          card.type === "demographics"
            ? "p-0"
            : "p-6"
        } rounded-xl border-2 shadow-xl ${
          card.type === "certify"
          ? "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-300"
            : card.type === "chance"
            ? "bg-gradient-to-br from-yellow-50 to-orange-50 border-orange-300"
            : card.type === "cover" && card.cover.type === "youtube"
            ? "bg-gradient-to-br from-purple-50 to-pink-50 border-purple-300"
            : card.type === "cover" && card.cover.type === "image"
            ? "bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-300"
            : card.type === "demographics"
            ? "border-transparent p-0"
            : card.type === "statement"
            ? getPastelColor(card.statement.id)
            : ""
        } ${
          isTopCard
            ? "cursor-grab active:cursor-grabbing"
            : "cursor-default"
        }`}
        style={{
          touchAction: isTopCard ? "none" : "auto",
          height: !isTopCard ? "286px" : "auto",
          overflow: !isTopCard ? "hidden" : "visible",
        }}
      >
        {isChargeable && chargeVisible && (
          <motion.div
            className={`absolute inset-0 rounded-xl pointer-events-none ${
              chargeSide === "agree"
                ? armed
                  ? "charge-glow-agree-armed"
                  : "charge-glow-agree"
                : armed
                ? "charge-glow-disagree-armed"
                : "charge-glow-disagree"
            }`}
            style={{ opacity: charge }}
          />
        )}
        {card.type === "chance" ? (
          <ChanceCard
            room={room}
            isTopCard={isTopCard}
            allowAnonymous={allowAnonymous}
            isAnonymous={isAnonymous}
            onSubmitStatement={onSubmitStatement}
            onShowAccountSetupModal={onShowAccountSetupModal}
          />
        ) : card.type === "cover" ? (
          <CoverCard
            cover={card.cover}
            isTopCard={isTopCard}
          />
        ) : card.type === "demographics" ? (
          <DemographicsCard
            question={card.question}
            onAnswer={(answer) => {
              onDemographicsAnswer && onDemographicsAnswer(card.question.id, answer);
            }}
          />
        ) : card.type === "certify" ? (
          <CertifyCard
            roomId={room.id}
            isActive={isTopCard}
            onSuccess={onCertifySuccess}
          />
        ) : card.type === "statement" ? (
          <StatementCard
            statement={card.statement}
            isTopCard={isTopCard}
            currentIndex={currentIndex}
            totalStatements={totalStatements}
            getTypeIcon={getTypeIcon}
            disagreeOpacity={disagreeOpacity}
            agreeOpacity={agreeOpacity}
            passOpacity={passOpacity}
            charge={charge}
            chargeVisible={chargeVisible}
            chargeSide={chargeSide}
            armed={armed}
            onSkip={onSkip}
            onFlag={onFlag}
          />
        ) : null}
      </div>
    </motion.div>
  );
}