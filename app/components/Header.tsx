"use client";

import { useState } from "react";
import { 
  useAuthenticator, 
  Flex, 
  Heading, 
  Avatar, 
  Button, 
  Text,
  Menu,
  MenuItem,
  View
} from "@aws-amplify/ui-react";

interface HeaderProps {
  userName: string | undefined;
}

export default function Header({ userName }: HeaderProps) {
  const { signOut } = useAuthenticator();

  // アバターの文字を取得（ユーザー名の最初の文字）
  const avatarText = userName ? userName[0].toUpperCase() : 'G';

  return (
    <Flex
      as="header"
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      padding="1rem"
      className="header-container"
    >
                  <Flex alignItems="center" gap="0.5rem">
              <View
                fontSize="1.5rem"
                color="#0066FF"
                marginRight="0.5rem"
              >
                📝
              </View>
              <Heading level={3}>
                Contract Checker
              </Heading>
            </Flex>
      
      <Flex alignItems="center" gap="0.5rem">
        
        <Menu 
          trigger={
            <Avatar
              className="account-avatar"
              alt={`${userName || 'ゲスト'}のアバター`}
            >
              {avatarText}
            </Avatar>
          }
        >
          <MenuItem onClick={signOut}>
            ログアウト
          </MenuItem>
        </Menu>
      </Flex>
    </Flex>
  );
} 